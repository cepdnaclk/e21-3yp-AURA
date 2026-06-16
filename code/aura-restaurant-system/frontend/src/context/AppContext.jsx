/**
 * ============================================================
 *  AURA Restaurant System — Global Application Context
 * ============================================================
 *  Manages:
 *    - Auth session (who is logged in, which table/role)
 *    - Menu items list (shared between RobotUI & AdminDashboard)
 *    - App-wide theme ('dark' | 'light')
 *
 *  All mock data clearly marked with [BACKEND INTEGRATION: TODO].
 * ============================================================
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DEFAULT_MENU_IMAGE_FILENAME, isKnownMenuImage } from '../utils/menuImages';
import authAPI from '../api/authAPI';
import menuAPI from '../api/menuAPI';
import walkInAPI from '../api/walkInAPI';


const MENU_STORAGE_KEY = 'aura_menu_items';
const MENU_STORAGE_VER = 2;

function loadInitialMenuItems() {
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.__v !== MENU_STORAGE_VER || !Array.isArray(parsed.items)) {
      return [];
    }
    return parsed.items;
  } catch {
    return [];
  }
}

function normalizeMenuItem(raw) {
  return {
    id: raw.menuItemId || raw.id,
    name: raw.name,
    description: raw.description || '',
    price: Number(raw.price) || 0,
    category: raw.category || 'popular',
    imageFilename: raw.imageUrl || raw.imageFilename || raw.menuItemImageUrl || DEFAULT_MENU_IMAGE_FILENAME,
    time: raw.prepTimeMinutes || raw.time || '15 min',
    rating: raw.rating || 0,
    available: raw.available ?? raw.availability ?? true,
    startTime: raw.orderTime || null,
  };
}

// ─── Mock Credentials Map ─────────────────────────────────────────────────────
// [BACKEND INTEGRATION: TODO] - POST /api/auth/login
// Description: Replace this static map with a real API call.
//   - Send { username, password } to the backend.
//   - Receive a JWT token (store in localStorage or httpOnly cookie) and a user
//     object containing { role, tableNumber, displayName }.
//   - On failure the backend returns 401; show an error message.
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_CREDENTIALS = {
  table1:  { password: 'table_pwd_1', role: 'table',   tableNumber: 'T1', displayName: 'Table 1' },
  table2:  { password: 'table_pwd_2', role: 'table',   tableNumber: 'T2', displayName: 'Table 2' },
  table3:  { password: 'table_pwd_3', role: 'table',   tableNumber: 'T3', displayName: 'Table 3' },
  table4:  { password: 'table_pwd_4', role: 'table',   tableNumber: 'T4', displayName: 'Table 4' },
  admin:   { password: 'admin123',    role: 'admin',   tableNumber: null, displayName: 'Admin' },
  kitchen: { password: 'kitchen123', role: 'kitchen',  tableNumber: null, displayName: 'Kitchen Staff' },
};

// ─── Initial Mock Menu Data ───────────────────────────────────────────────────
// [BACKEND INTEGRATION: TODO] - GET /api/menu
// Description: On app boot call GET /api/menu.
//   Returns: [{ id, name, price, category, imageUrl, imagePublicId, description, prepTime, rating, available }]
//   imageUrl/imagePublicId should come from Cloudinary once backend media upload is integrated.
//   Replace with fetched data. Use React Query for caching; invalidate when admin
//   adds or removes items via POST/DELETE /api/menu.
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_MENU_ITEMS = [
  {
    id: 1,
    name: 'Truffle Wagyu Burger',
    price: 28.99,
    category: 'popular',
    imageFilename: 'Truffle Wagyu Burger.jpg',
    description: 'Juicy wagyu patty with truffle aioli, caramelized onion, and brioche bun.',
    time: '15 min',
    rating: 4.9,
  },
  {
    id: 2,
    name: 'Lobster Risotto',
    price: 34.50,
    category: 'popular',
    imageFilename: 'Lobster Risotto.jpg',
    description: 'Creamy arborio risotto with butter-poached lobster and citrus herb finish.',
    time: '20 min',
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Dragon Roll Sushi',
    price: 22.00,
    category: 'popular',
    imageFilename: 'Dragon Roll Sushi.jpg',
    description: 'Signature dragon roll with fresh seafood, avocado, and house drizzle.',
    time: '12 min',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Aura special Grilled Salmon Fillet',
    price: 26.50,
    category: 'mains',
    imageFilename: 'Aura special Grilled Salmon Fillet.jpg',
    description: 'Tender grilled salmon served with seasonal vegetables and lemon butter.',
    time: '18 min',
    rating: 4.6,
  },
  // Local asset note: exact files for Herb Crusted Lamb and Mushroom Ravioli are not present yet,
  // so these two rows use the closest available placeholders from assets/food_images.
  {
    id: 5,
    name: 'Herb Crusted Lamb',
    price: 32.00,
    category: 'mains',
    imageFilename: 'lamb-barbecue-steak.jpg',
    description: 'Herb-marinated lamb with chargrilled finish and rosemary pan sauce.',
    time: '25 min',
    rating: 4.8,
  },
  {
    id: 6,
    name: 'Mushroom Ravioli',
    price: 19.50,
    category: 'mains',
    imageFilename: 'black-tea-with-chocolade-cake-table.jpg',
    description: 'House ravioli filled with wild mushrooms in a silky garlic cream sauce.',
    time: '14 min',
    rating: 4.5,
  },
  {
    id: 7,
    name: 'Quinoa Buddha Bowl',
    price: 16.00,
    category: 'healthy',
    imageFilename: 'Quinoa Buddha Bowl.jpg',
    description: 'Protein-rich quinoa bowl with greens, roasted vegetables, and tahini dressing.',
    time: '10 min',
    rating: 4.4,
  },
  {
    id: 8,
    name: 'Acai Power Bowl',
    price: 14.50,
    category: 'healthy',
    imageFilename: 'Acai Power Bowl.jpg',
    description: 'Acai blend topped with berries, granola, and chia for an energizing bite.',
    time: '8 min',
    rating: 4.5,
  },
  {
    id: 9,
    name: 'Avocado Poke Bowl',
    price: 18.00,
    category: 'healthy',
    imageFilename: 'Avocado Poke Bowl.jpg',
    description: 'Fresh poke bowl with avocado, crisp vegetables, and sesame soy glaze.',
    time: '10 min',
    rating: 4.6,
  },
  {
    id: 10,
    name: 'Molten Lava Cake',
    price: 12.00,
    category: 'desserts',
    imageFilename: 'Molten Lava Cake.jpg',
    description: 'Warm chocolate cake with rich molten center and light cocoa dusting.',
    time: '12 min',
    rating: 4.9,
  },
  {
    id: 11,
    name: 'Crème Brûlée',
    price: 10.50,
    category: 'desserts',
    imageFilename: 'Crème Brûlée.jpg',
    description: 'Classic vanilla custard topped with a crisp caramelized sugar crust.',
    time: '10 min',
    rating: 4.7,
  },
  {
    id: 12,
    name: 'Tiramisu Tower',
    price: 13.00,
    category: 'desserts',
    imageFilename: 'Tiramisu Tower.jpg',
    description: 'Layered espresso-soaked sponge with mascarpone cream and cocoa finish.',
    time: '8 min',
    rating: 4.8,
  },
  {
    id: 13,
    name: 'Matcha Latte',
    price: 6.50,
    category: 'drinks',
    imageFilename: 'Matcha Latte.jpg',
    description: 'Velvety ceremonial-grade matcha whisked with steamed milk.',
    time: '4 min',
    rating: 4.3,
  },
  {
    id: 14,
    name: 'Fresh Mango Smoothie',
    price: 8.00,
    category: 'drinks',
    imageFilename: 'Fresh Mango Smoothie.jpg',
    description: 'Chilled tropical smoothie blended from ripe mango and citrus.',
    time: '5 min',
    rating: 4.5,
  },
  {
    id: 15,
    name: 'Sparkling Rose Lemonade',
    price: 7.50,
    category: 'drinks',
    imageFilename: 'Sparkling Rose Lemonade.jpg',
    description: 'Floral sparkling lemonade with rose notes and a bright citrus finish.',
    time: '3 min',
    rating: 4.4,
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Auth state ──
  const [session, setSession]       = useState(null);
  const [loginError, setLoginError] = useState('');

  // ── Menu state ── (shared: RobotUI reads, AdminDashboard reads + writes)
  const [menuItems, setMenuItems]   = useState(loadInitialMenuItems);

  // [API ENDPOINT]: GET /api/v1/menu
  // [DATA SYNC]: Persist menu state locally so Admin edits remain visible after refresh.
  useEffect(() => {
    try {
      localStorage.setItem(
        MENU_STORAGE_KEY,
        JSON.stringify({ items: menuItems, __v: MENU_STORAGE_VER })
      );
    } catch {}
  }, [menuItems]);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const rawMenu = await menuAPI.getAllMenuItems();
        const normalized = rawMenu.map(normalizeMenuItem);
        setMenuItems(normalized);
      } catch (error) {
        console.warn('[AURA] Could not load menu from backend:', error.message || error);
      }
    };

    authAPI.restoreToken();
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        setSession(JSON.parse(storedUser));
      } catch {}
    }
    loadMenu();
  }, []);

  // [API ENDPOINT]: GET /api/v1/menu
  // [DATA SYNC]: Mirror menu changes from other tabs so Robot UI immediately reflects Admin-added items.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== MENU_STORAGE_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        if (payload.__v !== MENU_STORAGE_VER || !Array.isArray(payload.items)) return;
        setMenuItems(payload.items);
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Hidden order IDs state ──
const [hiddenOrderIds, setHiddenOrderIds] = useState(() => {
  try {
    const stored = localStorage.getItem('aura_hidden_order_ids');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
});

useEffect(() => {
  try {
    localStorage.setItem('aura_hidden_order_ids', JSON.stringify(hiddenOrderIds));
  } catch {}
}, [hiddenOrderIds]);



  // ── Theme state ── ('dark' | 'light')  persisted to localStorage
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('aura_theme') || 'dark'; }
    catch { return 'dark'; }
  });

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('aura_theme', next); } catch {}
      return next;
    });
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
const login = useCallback(async (username, password) => {
  setLoginError('');
  try {
    const response = await authAPI.login(username.trim().toLowerCase(), password);

    const role = String(response.role || '').toLowerCase();
    const normalizedUsername = String(response.username || '').toLowerCase();
    const tableMatch = normalizedUsername.match(/(\d+)/);
    const tableNumber = role === 'table' && tableMatch ? `T${tableMatch[1]}` : null;

    // Backend returns flat: { token, username, role, expiresIn }
    // Map to frontend session shape expected by Robot UI routing.
    const session = {
      username: response.username,
      role,
      token: response.token,
      tableNumber,
    };

    setSession(session);
    localStorage.setItem('authUser', JSON.stringify(session));
    return true;
  } catch (error) {
    const message = error.response?.data?.message || 'Invalid username or password.';
    setLoginError(message);
    return false;
  }
}, []);

  // ── Verify credentials WITHOUT logging in (used by Secure Logout modal) ──
  // NOTE: Backend does not currently expose a verify-logout endpoint,
  // so this remains a local fallback for the modal flow.
  const verifyCredentials = useCallback((username, password) => {
    const cred = MOCK_CREDENTIALS[username.trim().toLowerCase()];
    return !!(cred && cred.password === password);
  }, []);

  // ── New Customer Session ─────────────────────────────────────────────────

// Replace your existing startNewCustomer with this:
const startNewCustomerSession = useCallback(async (tableNumber, currentOrderIds = []) => {
  if (!tableNumber) return false;

  try {
    // 1. Create a new walk-in session in the backend
    const tableId = parseInt(tableNumber.replace(/\D/g, ''), 10) || 1;
    const { sessionId } = await walkInAPI.createSession(tableId);

    // 2. Store the new sessionId in the current session
    setSession(prev => {
      const updated = { ...prev, walkInSessionId: sessionId };
      localStorage.setItem('authUser', JSON.stringify(updated));
      return updated;
    });

    // 3. Hide current orders from the new customer's view
    setHiddenOrderIds(prev => {
      const existing = Array.isArray(prev[tableNumber]) ? prev[tableNumber] : [];
      return {
        ...prev,
        [tableNumber]: [...new Set([...existing, ...currentOrderIds])],
      };
    });

    return true;
  } catch (err) {
    console.error('[AURA] Failed to create new customer session:', err);
    return false;
  }
}, []);



const getHiddenOrderIds = useCallback((tableNumber) => {
  return new Set(hiddenOrderIds[tableNumber] || []);
}, [hiddenOrderIds]);


  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('[AURA] Logout failed:', error.message || error);
    }
    setSession(null);
    setLoginError('');
  }, []);

  // ── Add Menu Item (Admin only) ────────────────────────────────────────────
  const addMenuItem = useCallback(async (newItem, imageFile = null) => {
    const itemPayload = {
      name: newItem.name.trim(),
      description: (newItem.description || '').trim() || 'Freshly prepared signature dish from AURA kitchen.',
      price: Number(newItem.price) || 0,
      category: newItem.category || 'popular',
      availability: true,
      // If using preset image, pass the filename; if uploading, let backend handle the file
      imageUrl: newItem.imageFilename && !isKnownMenuImage(newItem.imageFilename)
        ? newItem.imageFilename
        : undefined,
      prepTimeMinutes: newItem.time || "15 min",
    };

    try {
      // Pass the image file to the API (can be null for preset images)
      const rawItem = await menuAPI.createMenuItem(itemPayload, imageFile);
      const itemWithId = normalizeMenuItem(rawItem);
      setMenuItems((prev) => [...prev, itemWithId]);
      return itemWithId;
    } catch (error) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      };
      console.error('[AURA] Add menu item failed:', JSON.stringify(errorDetails, null, 2));
      throw error;
    }
  }, []);

  // ── Update Menu Item (Admin only) ───────────────────────────────────────
  const updateMenuItem = useCallback(async (itemId, updatedItem, imageFile = null) => {
    console.log('updateMenuItem called with:', itemId, updatedItem, imageFile);
    const itemPayload = {
      name: updatedItem.name.trim(),
      description: (updatedItem.description || '').trim() || 'Freshly prepared signature dish from AURA kitchen.',
      price: Number(updatedItem.price) || 0,
      category: updatedItem.category || 'popular',
      availability: updatedItem.available ?? true,
      imageUrl: updatedItem.imageFilename && !isKnownMenuImage(updatedItem.imageFilename)
        ? updatedItem.imageFilename
        : undefined,
      prepTimeMinutes: updatedItem.time || "15 min",
    };

    try {
      const rawItem = await menuAPI.updateMenuItem(itemId, itemPayload, imageFile);
      const itemWithId = normalizeMenuItem(rawItem);
      setMenuItems((prev) => prev.map((item) => (item.id === itemId ? itemWithId : item)));
      return itemWithId;
    } catch (error) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      };
      console.error('[AURA] Update menu item failed:', JSON.stringify(errorDetails, null, 2));
      throw error;
    }
  }, []);

  // ── Delete Menu Item (Admin only) ─────────────────────────────────────────
  const deleteMenuItem = useCallback(async (itemId) => {
    try {
      await menuAPI.deleteMenuItem(itemId);
      setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('[AURA] Delete menu item failed:', error.response?.data || error.message || error);
      throw error;
    }
  }, []);

  // ── Refresh Menu Items (from MQTT) ───────────────────────────────────────
  const refreshMenu = useCallback(async () => {
    try {
      const rawMenu = await menuAPI.getAllMenuItems();
      const normalized = rawMenu.map(normalizeMenuItem);
      setMenuItems(normalized);
      console.log('[AURA] Menu refreshed via MQTT');
    } catch (error) {
      console.warn('[AURA] Failed to refresh menu:', error.message);
    }
  }, []);

  const value = {
    session, loginError,
    login, logout, verifyCredentials,
    theme, toggleTheme,
    menuItems, addMenuItem, updateMenuItem, deleteMenuItem, refreshMenu,
    startNewCustomerSession,
    getHiddenOrderIds,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}

export default AppContext;
