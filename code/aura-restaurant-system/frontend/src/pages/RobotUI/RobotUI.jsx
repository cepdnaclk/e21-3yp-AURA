import { useState, useEffect } from 'react';
import {
  ChefHat, Flame, Leaf, IceCreamCone, Coffee, UtensilsCrossed,
  Plus, Minus, LogOut, Sun, Moon, Lock, X,
  ShoppingCart, CreditCard, Trash2, CheckCircle2,
  Clock, Bike, PartyPopper,
} from 'lucide-react';
import { useAppContext }             from '../../context/AppContext';
import { useRestaurant, ORDER_STATUS } from '../../context/RestaurantContext';
import { getMenuImageSrc }           from '../../utils/menuImages';
import { orderMqtt }                 from '../../api/mqttclient';
import { useNavigate }               from 'react-router-dom';
import OrderHistoryModal             from '../../components/OrderHistoryModal/OrderHistoryModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATS = [
  { id: 'all',        label: 'All',        icon: ChefHat         },
  { id: 'Appetizers', label: 'Appetizers', icon: IceCreamCone    },
  { id: 'Rice',       label: 'Rice',       icon: ChefHat         },
  { id: 'Koththu',    label: 'Koththu',    icon: Flame           },
  { id: 'Noodle',     label: 'Noodle',     icon: UtensilsCrossed },
  { id: 'desserts',   label: 'Desserts',   icon: Leaf            },
  { id: 'Other',      label: 'Other',      icon: Coffee          },
];

const CATEGORY_ORDER = ['Appetizers', 'Rice', 'Koththu', 'Noodle', 'desserts', 'Other'];

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
  } = useAppContext();

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
      for (const item of cart) {
        await placeOrder(tableNumber, [item]);
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
  const confirmLogout = async () => {
    if (!lUser || !lPass) { setLErr('Enter username and password.'); return; }
    setLLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const ok = verifyCredentials(lUser, lPass);
    setLLoading(false);
    if (ok) logout(); else setLErr('Incorrect credentials.');
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

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all active:scale-90 ${D ? 'bg-white/5 hover:bg-white/15 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
            {D ? <Sun size={15}/> : <Moon size={15}/>}
          </button>

          {/* Staff logout */}
          <button onClick={() => { setLUser(''); setLPass(''); setLErr(''); setShowLogout(true); }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium transition-all active:scale-95 ${tc.btn2}`}>
            <LogOut size={12}/><span className="hidden sm:inline">Staff Logout</span>
          </button>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MENU GRID + PAGINATION
      ══════════════════════════════════════════════════ */}
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
                        <span className="text-sm sm:text-lg font-bold text-orange-500">${item.price.toFixed(2)}</span>
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

        {/* 🎉 Floating entertainment banner */}
        {confirmed.length > 0 && !delivered && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 w-max">
            <button
              onClick={() => navigate('/entertain')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-8 rounded-full shadow-[0_10px_40px_rgba(124,58,237,0.5)] font-bold text-base flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all animate-bounce ring-4 ring-purple-500/30 cursor-pointer">
              🎧 Listen to music while playing games! ✨
            </button>
          </div>
        )}

      </div>

      {/* ── Order History Modal ──────────────────────────────────────────────── */}
      {showHistory && (
        <OrderHistoryModal
          tableId={numericTableId}
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
                      <p className="text-orange-500 text-sm font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className={`text-xs ${tc.st}`}>${item.price.toFixed(2)} each</p>
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
                  <span className="text-2xl font-bold text-orange-500">${cartTotal.toFixed(2)}</span>
                </div>
                <div className={`flex items-center justify-between text-xs ${tc.st}`}>
                  <span>Table</span>
                  <span className={`font-semibold ${tc.tt}`}>{session?.tableNumber || 'T?'}</span>
                </div>
                <button onClick={confirmOrder} disabled={orderLoading}
                  className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
                  {orderLoading
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Sending to Kitchen...</>
                    : <><CreditCard size={18}/> Confirm Order — ${cartTotal.toFixed(2)}</>
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

      {/* ══════════════════════════════════════════════════
          STAFF LOGOUT MODAL
      ══════════════════════════════════════════════════ */}
      {showLogout && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-sm border shadow-2xl ${tc.modal}`}>
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Lock size={20} className="text-red-400"/>
                <h3 className={`font-display text-base sm:text-lg font-bold ${tc.tt}`}>Staff Verification</h3>
              </div>
              <button onClick={() => setShowLogout(false)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${tc.btn2}`}>
                <X size={14}/>
              </button>
            </div>
            <input type="text" value={lUser} onChange={e => setLUser(e.target.value)} placeholder="Username"
              className={`w-full rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-3 sm:mb-4 border text-sm ${tc.inp}`}/>
            <input type="password" value={lPass} onChange={e => setLPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmLogout()} placeholder="Password"
              className={`w-full rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-3 sm:mb-4 border text-sm ${tc.inp}`}/>
            {lErr && <div className="mb-3 sm:mb-4 text-xs text-red-400">⚠️ {lErr}</div>}
            <button onClick={confirmLogout} disabled={lLoading}
              className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-red-500 text-white text-sm font-bold">
              {lLoading ? 'Verifying...' : 'Logout'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}