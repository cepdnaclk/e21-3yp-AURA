import { useState, useEffect } from 'react';
import {
  ChefHat, Flame, Leaf, IceCreamCone, Coffee, UtensilsCrossed,
  Plus, Minus, LogOut, Sun, Moon, Lock, X,
  ShoppingCart, CreditCard, Trash2, CheckCircle2,
  Clock, Bike, PartyPopper,Settings, Mic, Bot, Send, Wine // <-- Added Mic, Bot, Send, Wine
} from 'lucide-react';
import { useAppContext }             from '../../context/AppContext';
import { useRestaurant, ORDER_STATUS } from '../../context/RestaurantContext';
import { formatPrice }               from '../../utils/helpers';
import { getMenuImageSrc }           from '../../utils/menuImages';
import { orderMqtt }                 from '../../api/mqttclient';
import { useNavigate }               from 'react-router-dom';
import OrderHistoryModal             from '../../components/OrderHistoryModal/OrderHistoryModal';
import waiterAPI                     from '../../api/waiterAPI';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATS = [
  { id: 'all',        label: 'All',        icon: ChefHat         },
  { id: 'Appetizers', label: 'Appetizers', icon: IceCreamCone    },
  { id: 'Rice',       label: 'Rice',       icon: ChefHat         },
  { id: 'Koththu',    label: 'Koththu',    icon: Flame           },
  { id: 'Noodle',     label: 'Noodle',     icon: UtensilsCrossed },
  { id: 'desserts',   label: 'Desserts',   icon: Leaf            },
  { id: 'Beverages',  label: 'Beverages',  icon: Wine            },
  { id: 'Other',      label: 'Other',      icon: Coffee          },
];

const CATEGORY_ORDER = ['Appetizers', 'Rice', 'Koththu', 'Noodle', 'desserts', 'Beverages', 'Other'];


const STATUS_CFG = {
  PENDING:   { label: 'Sent — Awaiting Kitchen',  icon: Clock,       color: 'text-sky-400',    bg: 'bg-sky-500/10',    ring: 'ring-sky-500/25'    },
  PREPARING: { label: 'Kitchen is Preparing…',    icon: ChefHat,     color: 'text-amber-400',  bg: 'bg-amber-500/10',  ring: 'ring-amber-500/25'  },
  READY:     { label: 'Robot is Delivering! 🤖',  icon: Bike,        color: 'text-orange-400', bg: 'bg-orange-500/10', ring: 'ring-orange-500/25' },
  DELIVERED: { label: 'Delivered! Enjoy 🎉',      icon: PartyPopper, color: 'text-emerald-400',bg: 'bg-emerald-500/10',ring: 'ring-emerald-500/25'},
  PAID:      { label: 'Payment Completed! 💳',    icon: CreditCard,  color: 'text-green-400',  bg: 'bg-green-500/10',  ring: 'ring-green-500/25'  },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function RobotUI() {
  const {
    session, logout, verifyCredentials,
    menuItems, theme, toggleTheme, refreshMenu,
    getHiddenOrderIds,
    startNewCustomerSession,
  } = useAppContext();
  
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [waiterError, setWaiterError] = useState(false); 
  const [showSettings, setShowSettings] = useState(false);
  const [modalMode, setModalMode] = useState('logout');

  // -- New AI Chat States --
  const [isListening, setIsListening] = useState(false);

  const { placeOrder, getUnpaidOrders } = useRestaurant();
  const navigate = useNavigate();

  // ── MQTT ──
  useEffect(() => {
    orderMqtt.connect();
    const unsub = orderMqtt.onMenuUpdate(() => refreshMenu());
    return () => unsub();
  }, [refreshMenu]);

  const D     = theme === 'dark';
  const table = session?.tableNumber || 'T?';

  // ── Unpaid / confirmed orders ──
  const allUnpaidOrders = getUnpaidOrders(table);
  const hiddenIds       = getHiddenOrderIds(table);
  const confirmed       = allUnpaidOrders.filter(order => !hiddenIds.has(order.id));
  const latest          = confirmed.length > 0 ? confirmed[confirmed.length - 1] : null;
  const status          = latest?.status || null;
  const delivered       = status === ORDER_STATUS.DELIVERED;

  // ── UI state ──
  const [cat, setCat]                   = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [showLogout, setShowLogout]     = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const [lUser, setLUser]               = useState('');
  const [lPass, setLPass]               = useState('');
  const [lErr, setLErr]                 = useState('');
  const [lLoading, setLLoading]         = useState(false);

  // ── Cart state ──
  const [cart, setCart]                 = useState([]);
  const [showCart, setShowCart]         = useState(false);
  const [orderPlaced, setOrderPlaced]   = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const numericTableId = session?.tableNumber
    ? parseInt(session.tableNumber.replace(/\D/g, ''), 10) || 1
    : 1;

  // ── Responsive items per page ──
  useEffect(() => {
    const calc = () => {
      const w    = window.innerWidth;
      const h    = window.innerHeight;
      const cols = w >= 1280 ? 4 : w >= 640 ? 3 : 2;
      const rows = h < 650 ? 1 : 2;
      setItemsPerPage(cols * rows);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // ── Pagination ──
  const filteredItems = cat === 'all'
    ? [...menuItems].sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.category);
        const bi = CATEGORY_ORDER.indexOf(b.category);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
    : menuItems.filter(i => i.category === cat);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const items      = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handleCatChange = (c) => { setCat(c); setCurrentPage(1); };

  // ─── Cart helpers ─────────────────────────────────────────────────────────
  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id);
      if (exists) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const increaseQty = (id) =>
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: c.quantity + 1 } : c));

  const decreaseQty = (id) =>
    setCart(prev => {
      const item = prev.find(c => c.id === id);
      if (!item) return prev;
      if (item.quantity === 1) return prev.filter(c => c.id !== id);
      return prev.map(c => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
    });

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  // ── Confirm order → Kitchen ──
  const confirmOrder = async () => {
    if (!cart.length) return;
    setOrderLoading(true);
    try {
      const tableNumber = session?.tableNumber || 'T1';
      const walkInSessionId = session?.walkInSessionId || null;
      for (const item of cart) {
        await placeOrder(tableNumber, [item], walkInSessionId);
      }
      setCart([]);
      setShowCart(false);
      setOrderPlaced(true);
      setTimeout(() => setOrderPlaced(false), 3000);
    } catch (err) {
      console.error('Order failed:', err);
    } finally {
      setOrderLoading(false);
    }
  };

  // ── Staff logout ──
const confirmStaffAction = async () => {
  if (!lUser || !lPass) { setLErr('Enter username and password.'); return; }
  setLLoading(true);
  await new Promise(r => setTimeout(r, 500));
  const ok = verifyCredentials(lUser, lPass);
  setLLoading(false);

  if (!ok) { setLErr('Incorrect credentials.'); return; }

  if (modalMode === 'logout') {
    logout();
  } else {
    // New customer — get current unpaid order IDs to hide them
    const currentOrderIds = allUnpaidOrders.map(o => o.id);
    const success = await startNewCustomerSession(session?.tableNumber, currentOrderIds);
    if (success) {
      setShowLogout(false);
      setCart([]);
    } else {
      setLErr('Failed to create new session. Try again.');
    }
  }
};

// --- AI FUNCTIONS  ---
  const getMenuContext = () => {
    const simplifiedMenu = menuItems.map(item => ({
      name: item.name,
      price: item.price,
      description: item.description
    }));
    return JSON.stringify(simplifiedMenu);
  };

  const triggerVoiceMic = () => {
    setIsListening(true);
    
    orderMqtt.publish('aura/robot/ai-command', {
      action: "START_VOICE_MIC",
      menu: getMenuContext(),
      tableNumber: session?.tableNumber || 'T1'
    });
    
    // 10 second timeout gives AURA enough time to listen and think
    setTimeout(() => setIsListening(false), 10000); 
  };

  // ── Theme colour map ──
  const tc = {
    root:    D ? 'bg-[#0d0d0d]'                              : 'bg-gray-100',
    bar:     D ? 'bg-[#111] border-white/5'                  : 'bg-white border-gray-200',
    card:    D ? 'bg-[#1a1a1a] border-white/5 hover:border-orange-500/40' : 'bg-white border-gray-200 hover:border-orange-400 hover:shadow-sm',
    hero:    D ? 'from-[#222] to-[#1a1a1a]'                 : 'from-orange-50 to-white',
    tt:      D ? 'text-white'                                : 'text-gray-900',
    st:      D ? 'text-gray-400'                             : 'text-gray-500',
    mc:      D ? 'text-gray-600'                             : 'text-gray-400',
    catA:    'bg-orange-500 text-white shadow-md shadow-orange-500/30',
    catI:    D ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200',
    btn2:    D ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700',
    modal:   D ? 'bg-[#1a1a1a] border-white/10'             : 'bg-white border-gray-200',
    inp:     D ? 'bg-[#0d0d0d] border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400',
    pgBtn:   D ? 'bg-white/5 hover:bg-white/15 text-gray-300 border border-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200',
    pgBox:   D ? 'bg-white/[0.03] border-white/8'           : 'bg-white border-gray-200',
    cartRow: D ? 'bg-white/5 border-white/5'                : 'bg-gray-50 border-gray-200',
    divider: D ? 'border-white/10'                          : 'border-gray-200',
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans transition-colors duration-300 ${tc.root}`}>

      {/* ══════════════════════════════════════════════════
          TOP BAR
      ══════════════════════════════════════════════════ */}
      <div className={`flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 border-b ${tc.bar}`}>

        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <ChefHat size={18} className="text-white"/>
          </div>
          <div>
            <p className={`font-display text-sm sm:text-base font-bold leading-tight ${tc.tt}`}>AURA Menu</p>
            <p className="text-[10px] sm:text-xs text-orange-500 font-medium">{session?.displayName} — Touch to order</p>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex-1 flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide px-1 sm:px-2">
          {CATS.map(({ id, label, icon: Ic }) => (
            <button key={id} onClick={() => handleCatChange(id)}
              className={`flex-shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-200 active:scale-95 ${cat === id ? tc.catA : tc.catI}`}>
              <Ic size={12}/>{label}
            </button>
          ))}
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

          {/* 🔔 Ask Waiter Button */}
          <button
            onClick={async () => {
              try {
                await waiterAPI.callWaiter(
                  numericTableId,
                  table,
                  'Customer needs assistance'
                );
                setWaiterCalled(true);
                setTimeout(() => setWaiterCalled(false), 3000);
              } catch (err) {
                console.error('Waiter call failed:', err);
                setWaiterError(true);
                setTimeout(() => setWaiterError(false), 3000);
              }
            }}


            className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 
              rounded-[10px] text-[11px] sm:text-xs font-semibold transition-all 
              duration-200 hover:-translate-y-[1px] active:translate-y-0 hover:shadow-lg ${
              D
                ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/25'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100'
            }`}>
            <span className="text-sm sm:text-base">🔔</span>
            <span>Ask Waiter</span>
          </button>

          {/* 📋 Order status */}
          <button
            onClick={() => setShowHistory(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-[10px] text-[11px] sm:text-xs font-semibold transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 hover:shadow-lg ${
              D
                ? 'bg-white/12 text-white border border-white/25 hover:bg-white/22 hover:border-white/45 shadow-black/20'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 shadow-gray-200'
            }`}>
            <span className="text-sm sm:text-base">📋</span>
            <span>Your Order Status</span>
          </button>


        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT AREA (Menu + Right Sidebar)
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex flex-row">

        {/* ── LEFT: MENU GRID + PAGINATION ── */}
        <div className="flex-1 overflow-hidden flex flex-col px-3 sm:px-5 pt-3 sm:pt-5 pb-2 sm:pb-3 gap-2 sm:gap-3 relative">

          {/* Grid */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 h-full content-start">
              {items.map(item => {
                const cartQty = cart.find(c => c.id === item.id)?.quantity || 0;
                return (
                  <div key={item.id} className={`border rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col justify-between ${tc.card}`}>

                    {/* Image */}
                    <div className={`h-24 sm:h-32 xl:h-40 flex-shrink-0 bg-gradient-to-br ${tc.hero} relative overflow-hidden`}>
                      <img src={getMenuImageSrc(item.imageFilename)} alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      <div className={`absolute inset-0 ${D ? 'bg-black/25' : 'bg-black/10'}`}/>
                      {cartQty > 0 && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                          {cartQty}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2 sm:p-4 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className={`font-semibold text-xs sm:text-sm leading-tight mb-1 truncate ${tc.tt}`}>{item.name}</h3>
                        <p className={`text-[10px] sm:text-xs leading-3 sm:leading-4 mb-1 sm:mb-2 line-clamp-1 sm:line-clamp-2 ${tc.st}`}>
                          {item.description || 'Chef crafted signature dish.'}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2 sm:mb-3 mt-1">
                          <span className="text-sm sm:text-lg font-bold text-orange-500">{formatPrice(item.price)}</span>
                          <span className={`text-[9px] sm:text-xs ${tc.mc}`}>⏱ {item.time}</span>
                        </div>

                        {cartQty === 0 ? (
                          <button onClick={() => addToCart(item)}
                            className="w-full h-8 sm:h-10 rounded-lg sm:rounded-xl font-semibold text-[11px] sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1 sm:gap-2 bg-orange-500 hover:bg-orange-400 text-white shadow-md shadow-orange-500/20">
                            <Plus size={14}/>Add to Order
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => decreaseQty(item.id)}
                              className={`flex-1 h-8 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all active:scale-95 ${D ? 'bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400' : 'bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500'}`}>
                              <Minus size={14}/>
                            </button>
                            <span className={`w-7 text-center text-sm font-bold ${tc.tt}`}>{cartQty}</span>
                            <button onClick={() => increaseQty(item.id)}
                              className="flex-1 h-8 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all active:scale-95 bg-orange-500/20 hover:bg-orange-500 text-orange-500 hover:text-white">
                              <Plus size={14}/>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className={`flex-shrink-0 flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl border ${tc.pgBox}`}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${tc.pgBtn}`}>
                ← Prev
              </button>
              <div className="flex items-center gap-1 sm:gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition-all active:scale-95 ${
                      currentPage === page
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                        : D ? 'bg-white/5 text-gray-400 hover:bg-white/15 hover:text-white border border-white/10'
                            : 'bg-white text-gray-500 hover:bg-orange-50 hover:text-orange-500 border border-gray-200'
                    }`}>
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${tc.pgBtn}`}>
                Next →
              </button>
            </div>
          )}

          {/* 🎉 Floating entertainment banner
          {(
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 w-max">
              <button
                onClick={() => navigate('/entertain')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-8 rounded-full shadow-[0_10px_40px_rgba(124,58,237,0.5)] font-bold text-base flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all animate-bounce ring-4 ring-purple-500/30 cursor-pointer">
                🎧 Listen to music while playing games! ✨
              </button>
            </div>
          )} */}

        </div>
        {/* ══════════════════════════════════════════════════
            RIGHT SIDEBAR
        ══════════════════════════════════════════════════ */}
        <div className={`flex-shrink-0 w-16 sm:w-20 flex flex-col items-center py-4 gap-3 border-l ${tc.bar}`}>
          {/* Empty — features coming soon */}

          {/* 🛒 Cart */}
          <button
            onClick={() => setShowCart(true)}
            className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all active:scale-90 ${D ? 'bg-white/5 hover:bg-white/15 text-orange-400' : 'bg-gray-100 hover:bg-gray-200 text-orange-500'}`}>
            <ShoppingCart size={15}/>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* 💳 Pay */}
          <button
            onClick={() => alert('Pay button clicked!')}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all active:scale-90 ${D ? 'bg-white/5 hover:bg-white/15 text-green-400' : 'bg-gray-100 hover:bg-gray-200 text-green-600'}`}>
            <CreditCard size={15} className="sm:w-[17px] sm:h-[17px]"/>
          </button>

          {/* 🎵 Music button */}
          <button
            onClick={() => navigate('/entertain/music')}             className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40`}>
            <span className="text-base">🎵</span>
            <span className="text-[9px] font-medium text-purple-400">Music</span>
          </button>

          {/* 🎮 Games button */}
          <button
            onClick={() => navigate('/entertain/games')}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40`}>
            <span className="text-base">🎮</span>
            <span className="text-[9px] font-medium text-indigo-400">Games</span>
          </button>

          {/* --- VOICE MIC BUTTON --- */}
          <button
            onClick={triggerVoiceMic}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40`}
          >
            <Mic size={18} className="text-sky-500"/>
            <span className="text-[9px] font-medium text-sky-500">Voice</span>
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all active:scale-90 ${D ? 'bg-white/5 hover:bg-white/15 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
            {D ? <Sun size={15}/> : <Moon size={15}/>}
          </button>


          {/* ⚙️ Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(prev => !prev)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                showSettings
                  ? D ? 'bg-white/15 text-white' : 'bg-gray-200 text-gray-900'
                  : D ? 'bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
              }`}>
              <Settings size={15}/>
            </button>

            {/* Dropdown */}
            {showSettings && (
              <>
                {/* Backdrop - click outside වලදී close වෙනවා */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSettings(false)}
                />

                <div className={`absolute right-0 top-11 z-50 w-52 rounded-2xl border shadow-2xl overflow-hidden ${tc.modal}`}>

                  {/* Header */}
                  <div className={`px-4 py-3 border-b ${D ? 'border-white/10' : 'border-gray-100'}`}>
                    <p className={`text-xs font-semibold ${tc.st}`}>Staff Controls</p>
                  </div>

                  {/* New Customer option */}
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setLUser(''); setLPass(''); setLErr('');
                      setModalMode('newCustomer');
                      setShowLogout(true);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all hover:bg-teal-500/10 text-teal-400 hover:text-teal-300`}>
                    <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                      <Plus size={14} className="text-teal-400"/>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">New Customer</p>
                      <p className={`text-[10px] ${tc.st}`}>Start fresh session</p>
                    </div>
                  </button>

                  {/* Divider */}
                  <div className={`mx-4 border-t ${D ? 'border-white/5' : 'border-gray-100'}`}/>

                  {/* Staff Logout option */}
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setLUser(''); setLPass(''); setLErr('');
                      setModalMode('logout');
                      setShowLogout(true);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all hover:bg-red-500/10 text-red-400 hover:text-red-300`}>
                    <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                      <LogOut size={14} className="text-red-400"/>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Staff Logout</p>
                      <p className={`text-[10px] ${tc.st}`}>Verify & logout</p>
                    </div>
                  </button>

                </div>
              </>
            )}
          </div>


        </div>

      </div>

      {/* ── Order History Modal ──────────────────────────────────────────────── */}
      {showHistory && (
        console.log("DEBUG sessionId:", session?.walkInSessionId, "tableId:", numericTableId),
        <OrderHistoryModal
          tableId={numericTableId}
          sessionId={session?.walkInSessionId}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════
          CART POPUP MODAL
      ══════════════════════════════════════════════════ */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] ${tc.modal}`}>

            {/* Header */}
            <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${tc.divider}`}>
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} className="text-orange-500"/>
                <h2 className={`text-lg font-bold ${tc.tt}`}>Your Order</h2>
                {cartCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold">
                    {cartCount} item{cartCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button onClick={() => setShowCart(false)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${tc.btn2}`}>
                <X size={16}/>
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <ShoppingCart size={40} className={tc.mc}/>
                  <p className={`text-sm ${tc.st}`}>No items in cart yet.</p>
                  <button onClick={() => setShowCart(false)}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold">
                    Browse Menu
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${tc.cartRow}`}>

                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={getMenuImageSrc(item.imageFilename)} alt={item.name}
                        className="w-full h-full object-cover"/>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${tc.tt}`}>{item.name}</p>
                      <p className="text-orange-500 text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                      <p className={`text-xs ${tc.st}`}>{formatPrice(item.price)} each</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => decreaseQty(item.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${D ? 'bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400' : 'bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500'}`}>
                        <Minus size={14}/>
                      </button>
                      <span className={`w-6 text-center text-sm font-bold ${tc.tt}`}>{item.quantity}</span>
                      <button onClick={() => increaseQty(item.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 bg-orange-500/20 hover:bg-orange-500 text-orange-500 hover:text-white">
                        <Plus size={14}/>
                      </button>
                    </div>

                    <button onClick={() => removeFromCart(item.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 flex-shrink-0 ${D ? 'bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400' : 'bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500'}`}>
                      <Trash2 size={14}/>
                    </button>

                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className={`flex-shrink-0 px-6 py-4 border-t ${tc.divider} space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${tc.st}`}>Total</span>
                  <span className="text-2xl font-bold text-orange-500">{formatPrice(cartTotal)}</span>
                </div>
                <div className={`flex items-center justify-between text-xs ${tc.st}`}>
                  <span>Table</span>
                  <span className={`font-semibold ${tc.tt}`}>{session?.tableNumber || 'T?'}</span>
                </div>
                <button onClick={confirmOrder} disabled={orderLoading}
                  className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
                  {orderLoading
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Sending to Kitchen...</>
                    : <><CreditCard size={18}/> Confirm Order — {formatPrice(cartTotal)}</>
                  }
                </button>
                <button onClick={() => setCart([])}
                  className={`w-full h-9 rounded-xl text-xs font-medium transition-all active:scale-95 ${tc.btn2}`}>
                  Clear All Items
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
                  ORDER SUCCESS TOAST
          ══════════════════════════════════════════════════ */}
      {orderPlaced && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 animate-bounce">
          <CheckCircle2 size={22}/>
          <div>
            <p className="font-bold text-sm">Order Sent to Kitchen!</p>
            <p className="text-xs text-emerald-100">Your order is being prepared 🍽️</p>
          </div>
        </div>
      )}

      {/* 🔔 Waiter Called Toast */}
      {waiterCalled && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-yellow-500 text-white shadow-2xl shadow-yellow-500/40 animate-bounce">
          <span className="text-xl">🔔</span>
          <div>
            <p className="font-bold text-sm">Waiter Called!</p>
            <p className="text-xs text-yellow-100">Staff member will assist you shortly 😊</p>
          </div>
        </div>
      )}

      {/* ❌ Waiter Call Failed Toast — ERROR */}
      {waiterError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-500 text-white shadow-2xl shadow-red-500/40 animate-bounce">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-sm">Call Failed!</p>
            <p className="text-xs text-red-100">Please try again or speak to staff directly.</p>
          </div>
        </div>
      )}

    {/* ══════════════════════════════════════════════════
        STAFF LOGOUT / NEW CUSTOMER MODAL
    ══════════════════════════════════════════════════ */}
    {showLogout && (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${tc.modal}`}>

          {/* ── Colored Header Strip ── */}
          <div className={`px-6 py-5 flex items-center justify-between ${
            modalMode === 'logout'
              ? 'bg-red-500/10 border-b border-red-500/20'
              : 'bg-teal-500/10 border-b border-teal-500/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                modalMode === 'logout' ? 'bg-red-500/20' : 'bg-teal-500/20'
              }`}>
                {modalMode === 'logout'
                  ? <LogOut size={18} className="text-red-400"/>
                  : <Plus size={18} className="text-teal-400"/>
                }
              </div>
              <div>
                <h3 className={`font-bold text-base ${tc.tt}`}>
                  {modalMode === 'logout' ? 'Staff Verification' : 'New Customer'}
                </h3>
                <p className={`text-xs ${tc.st}`}>
                  {modalMode === 'logout' ? 'Enter credentials to logout' : 'Start a new customer session'}
                </p>
              </div>
            </div>

            {/* ✕ Close button */}
            <button
              onClick={() => { setShowLogout(false); setLErr(''); setLUser(''); setLPass(''); }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${tc.btn2}`}>
              <X size={16}/>
            </button>
          </div>

          {/* ── Form Body ── */}
          <div className="px-6 py-5 space-y-3">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${tc.st}`}>Username</label>
              <input
                type="text"
                value={lUser}
                onChange={e => setLUser(e.target.value)}
                placeholder="Enter username"
                className={`w-full rounded-xl px-4 py-3 border text-sm focus:outline-none focus:ring-2 ${
                  modalMode === 'logout' ? 'focus:ring-red-500/30' : 'focus:ring-teal-500/30'
                } ${tc.inp}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${tc.st}`}>Password</label>
              <input
                type="password"
                value={lPass}
                onChange={e => setLPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmStaffAction()}
                placeholder="Enter password"
                className={`w-full rounded-xl px-4 py-3 border text-sm focus:outline-none focus:ring-2 ${
                  modalMode === 'logout' ? 'focus:ring-red-500/30' : 'focus:ring-teal-500/30'
                } ${tc.inp}`}
              />
            </div>

            {/* Error message */}
            {lErr && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="text-red-400 text-sm">⚠️</span>
                <span className="text-xs text-red-400">{lErr}</span>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className={`px-6 pb-6 flex gap-3`}>
            <button
              onClick={() => { setShowLogout(false); setLErr(''); setLUser(''); setLPass(''); }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${tc.btn2}`}>
              Cancel
            </button>
            <button
              onClick={confirmStaffAction}
              disabled={lLoading}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 ${
                modalMode === 'logout'
                  ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/25'
                  : 'bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/25'
              }`}>
              {lLoading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Verifying...</>
                : modalMode === 'logout'
                  ? <><LogOut size={15}/> Logout</>
                  : <><Plus size={15}/> Start Session</>
              }
            </button>
          </div>

        </div>
      </div>
    )}

    {/* --- REPLACE THE TYPING MODAL WITH THIS OVERLAY --- */}
      {isListening && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 transition-all">
          <div className="flex flex-col items-center gap-6">
            
            {/* Glowing Pulsing Mic */}
            <div className="w-28 h-28 rounded-full bg-sky-500/20 flex items-center justify-center animate-pulse border-4 border-sky-500/50 shadow-[0_0_60px_rgba(14,165,233,0.5)]">
              <Mic size={56} className="text-sky-400 animate-bounce" />
            </div>
            
            {/* Text Prompts */}
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold text-white tracking-wide">AURA is Listening...</h3>
              <p className="text-sky-200 text-lg">Speak your question clearly into the robot</p>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setIsListening(false)}
              className="mt-8 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all active:scale-95 border border-white/20"
            >
              Cancel
            </button>
            
          </div>
        </div>
      )}
    </div>
  );
}