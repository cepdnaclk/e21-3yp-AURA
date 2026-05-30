/**
 * ============================================================
 *  AURA Restaurant System — Admin Dashboard
 * ============================================================
 *  Two tabs:
 *    1. Overview  — stats, recent orders, robot fleet
 *    2. Manage Menu — add / delete menu items (syncs to RobotUI)
 *
 *  BACKEND INTEGRATION POINTS are marked with [TODO] comments.
 * ============================================================
 */

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, UtensilsCrossed, DollarSign, ShoppingBag,
  Bot, ArrowUpRight, ArrowDownRight, Plus,
  Trash2, Activity, LogOut, Save,
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { formatPrice } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { AVAILABLE_MENU_IMAGES, getMenuImageSrc, isKnownMenuImage } from '../../utils/menuImages';
import { orderMqtt } from '../../api/mqttclient';

// ── Mock robot fleet data ─────────────────────────────────────────────────────
// [BACKEND INTEGRATION: TODO] - GET /api/robots/status
// Description: Fetch real-time robot status from backend (battery, state, active deliveries).
// Consider polling every 10 s or using WebSocket for live updates.
// ─────────────────────────────────────────────────────────────────────────────
const ROBOTS_DATA = [
  { id: 'AURA-01', status: 'delivering', battery: 87, deliveries: 24 },
  { id: 'AURA-02', status: 'idle',       battery: 95, deliveries: 18 },
  { id: 'AURA-03', status: 'charging',   battery: 32, deliveries: 21 },
  { id: 'AURA-04', status: 'delivering', battery: 64, deliveries: 16 },
];

// ── Category choices for menu form ───────────────────────────────────────────
const MENU_CATEGORIES = [
  { value: 'Rice',  label: 'Rice'  },
  { value: 'Koththu',    label: 'Koththu' },
  { value: 'Noodle',  label: 'Noodle'  },
  { value: 'desserts', label: 'Desserts' },
  { value: 'Appetizers',   label: 'Appetizers' },
  { value: 'Other',   label: 'Other' },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { session, logout, menuItems, addMenuItem, deleteMenuItem, refreshMenu } = useAppContext();
  const {
    activeOrders,
    orderHistory,
    getConfirmedRevenue,
    getPendingOrderTotal,
    refreshOrders
  } = useRestaurant();
  const isAdmin = session?.role === 'admin';

  // ── Real-time Stats State ────────────────────────────────────────────────
  const [realtimeStats, setRealtimeStats] = useState({
    confirmedRevenue: 0,
    activeOrderCount: 0,
    pendingTotal: 0,
    robotsOnline: 0,
    robotsTotal: ROBOTS_DATA.length,
  });
  const [robotFleet, setRobotFleet] = useState(ROBOTS_DATA);

  // Subscribe to menu updates and real-time stats from MQTT
useEffect(() => {
  orderMqtt.connect();

  const unsubMenu = orderMqtt.onMenuUpdate((data) => {
    console.log('🍽️ Menu update received:', data);
    refreshMenu();
  });

  const unsubStats = orderMqtt.onDashboardStats((data) => {
    console.log('📊 Dashboard stats update received:', data);
    setRealtimeStats((prev) => ({
      ...prev,
      confirmedRevenue: data.confirmedRevenue ?? prev.confirmedRevenue,
      activeOrderCount: data.activeOrderCount ?? prev.activeOrderCount,
      pendingTotal: data.pendingTotal ?? prev.pendingTotal,
    }));
  });

  const unsubRobots = orderMqtt.onRobotFleetUpdate((data) => {
    console.log('🤖 Robot fleet update received:', data);
    if (data.robots && Array.isArray(data.robots)) {
      setRobotFleet(data.robots);
      const activeCount = data.robots.filter((r) => r.status !== 'charging').length;
      setRealtimeStats((prev) => ({
        ...prev,
        robotsOnline: activeCount,
        robotsTotal: data.robots.length,
      }));
    }
  });

  // ← add these two
  const unsubNewOrder = orderMqtt.onNewOrder(async (data) => {
    console.log('🔔 New order received on admin dashboard:', data);
    await refreshOrders();
  });

  const unsubStatusUpdate = orderMqtt.onOrderStatusUpdate(async (data) => {
    console.log('🔄 Order status update on admin dashboard:', data);
    await refreshOrders();
  });

  return () => {
    unsubMenu();
    unsubStats();
    unsubRobots();
    unsubNewOrder();       // ← cleanup
    unsubStatusUpdate();   // ← cleanup
  };
}, [refreshMenu, refreshOrders]);  // ← add refreshOrders to deps

  // [API ENDPOINT]: GET /api/v1/admin/revenue?status=PAID
  // [DATA SYNC]: Revenue is derived only from paid tickets so kitchen placements never inflate earnings.
  // Falls back to computed value if MQTT stats not yet received
  const confirmedRevenue = realtimeStats.confirmedRevenue || getConfirmedRevenue();

  // [API ENDPOINT]: GET /api/v1/admin/stats
  // [DATA SYNC]: Pending total tracks kitchen-sent but unpaid orders for accurate outstanding exposure.
  // Falls back to computed value if MQTT stats not yet received
  const pendingOrderTotal = realtimeStats.pendingTotal || getPendingOrderTotal();
  const activeOrderCount = realtimeStats.activeOrderCount || activeOrders.length;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'menu'

  // ── Image mode: 'preset' = predefined images, 'upload' = upload new ────────
  const [imageMode, setImageMode] = useState('preset'); // 'preset' | 'upload'

  // ── Manage Menu form state ────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Rice',
    imageFilename: AVAILABLE_MENU_IMAGES[0] || '',
    imageFile: null, // For file upload
    time: '15 min',
  });
  const [formError, setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ── Stats for overview (Updated in real-time via MQTT) ───────────────────
  // [MQTT TOPICS]: aura/admin/stats, aura/admin/robots
  // Description: Stats are now updated in real-time via MQTT messages from backend
  //   Expected fields: { confirmedRevenue, activeOrderCount, pendingTotal, robots[] }
  const stats = [
    {
      label: 'Confirmed Revenue',
      value: formatPrice(confirmedRevenue),
      change: 'Paid only', up: true, icon: DollarSign, color: 'from-emerald-500 to-green-400',
    },
    {
      label: 'Active Orders',
      value: activeOrderCount,
      change: 'Live', up: true, icon: ShoppingBag, color: 'from-aura-500 to-aura-400',
    },
    {
      label: 'Pending Order Total',
      value: formatPrice(pendingOrderTotal),
      change: 'Unpaid', up: true, icon: ShoppingBag, color: 'from-cyan-500 to-blue-400',
    },
    {
      label: 'Robots Active',
      value: `${realtimeStats.robotsOnline}/${realtimeStats.robotsTotal}`,
      change: 'Online', up: true, icon: Bot, color: 'from-amber-500 to-yellow-400',
    },
  ];

  let recentOrders = [...orderHistory].slice(-6).reverse();

// After — shows both active and historical, newest first
 recentOrders = [...activeOrders, ...orderHistory]
  .filter((o, idx, arr) => arr.findIndex(x => x.id === o.id) === idx) // dedupe
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 6);

  // [API ENDPOINT]: POST /api/v1/menu
  // [DATA SYNC]: Adds menu entries into shared context so Robot and Admin views render the same catalog immediately.
  const handleAddItem = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!isAdmin) return setFormError('Only an authenticated admin can modify the menu.');
    if (!form.name.trim()) return setFormError('Item name is required.');
    if (!form.description.trim()) return setFormError('Please add a short food description.');
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) return setFormError('Enter a valid price greater than 0.');
    
    // Validate image: either preset image or uploaded file
    if (imageMode === 'preset') {
      if (!form.imageFilename || !isKnownMenuImage(form.imageFilename)) {
        return setFormError('Select a valid menu image from assets/food_images.');
      }
    } else if (imageMode === 'upload') {
      if (!form.imageFile) {
        return setFormError('Please upload an image file.');
      }
    }

    try {
      // Pass either uploaded file or preset image filename
      const itemData = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        price,
      };
      
      // If uploading a new image, pass the file; otherwise pass null for file
      const imageFile = imageMode === 'upload' ? form.imageFile : null;
      
      await addMenuItem(itemData, imageFile);
      setFormSuccess(`"${form.name}" added to the menu! It's now visible on RobotUI.`);
      setForm({
        name: '',
        description: '',
        price: '',
        category: 'Rice',
        imageFilename: AVAILABLE_MENU_IMAGES[0] || '',
        imageFile: null,
        time: '15 min',
      });
      setImageMode('preset'); // Reset to preset mode
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (error) {
      setFormError(error.response?.data?.message || error.response?.data || 'Failed to add menu item. Try again.');
    }
  };

  // [API ENDPOINT]: DELETE /api/v1/menu/:id
  // [DATA SYNC]: Removes menu rows from shared context so ordering screens cannot use deleted items.
  const handleDeleteItem = async (itemId, itemName) => {
    if (!isAdmin) return;
    if (!window.confirm(`Remove "${itemName}" from the menu?`)) return;
    try {
      await deleteMenuItem(itemId);
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to remove menu item.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between px-6 lg:px-8 pt-8 pb-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="text-aura-400" size={28} />
              Admin Dashboard
            </h1>
            <p className="text-dark-400 mt-1 text-sm">
              Restaurant operations overview and management
            </p>
          </div>
          <button
            id="admin-logout-btn"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                bg-white/5 hover:bg-white/10 text-dark-300 hover:text-white
                text-sm transition-all active:scale-95"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div className="px-6 lg:px-8 flex gap-2 mb-6 border-b border-dark-700/50 pb-4">
          {[
            { id: 'overview', label: 'Overview',    icon: LayoutDashboard  },
            { id: 'menu',     label: 'Manage Menu', icon: UtensilsCrossed  },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`admin-tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                          transition-all duration-200
                          ${activeTab === id
                            ? 'bg-aura-600/20 text-aura-300 border border-aura-500/30'
                            : 'text-dark-400 hover:text-white hover:bg-white/5'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════ TAB: OVERVIEW ══════════════════════ */}
        {activeTab === 'overview' && (
          <div className="flex-1 px-6 lg:px-8 space-y-8 pb-8">

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} hover={false} className="relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-dark-400 uppercase tracking-wider">
                          {stat.label}
                        </p>
                        <p className="text-3xl font-bold text-white mt-2 font-display">
                          {stat.value}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          {stat.up
                            ? <ArrowUpRight size={14} className="text-emerald-400" />
                            : <ArrowDownRight size={14} className="text-red-400" />}
                          <span className={`text-xs font-medium ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color}
                                      flex items-center justify-center shadow-lg`}>
                        <Icon size={22} className="text-white" />
                      </div>
                    </div>
                    <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full
                                    bg-gradient-to-br ${stat.color} opacity-5 blur-xl`} />
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <div className="lg:col-span-2">
                <Card hover={false} className="p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b border-dark-700/50 flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                      <ShoppingBag size={18} className="text-aura-400" />
                      Recent Orders
                    </h2>
                    <span className="text-xs text-dark-500">{recentOrders.length} orders</span>
                  </div>
                  <div className="divide-y divide-dark-700/20">
                    {recentOrders.length === 0 ? (
                      <div className="px-6 py-10 text-center text-sm text-dark-500">
                        No orders recorded yet.
                      </div>
                    ) : (
                      recentOrders.map((order) => (
                        <div key={order.id}
                             className="px-6 py-4 flex items-center gap-4 hover:bg-dark-800/30 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-sm font-bold text-aura-300">
                            {order.tableNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{order.id}</p>
                            <p className="text-xs text-dark-500 truncate">
                              {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                            </p>
                          </div>
                          <StatusBadge status={order.status} />
                          <span className="text-sm font-bold text-white ml-2">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Robot Fleet (Real-time updates via MQTT) */}
              <div>
                <Card hover={false} className="p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b border-dark-700/50">
                    <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                      <Bot size={18} className="text-cyan-400" />
                      Robot Fleet
                    </h2>
                  </div>
                  <div className="p-4 space-y-3">
                    {robotFleet.map((robot) => (
                      <div key={robot.id}
                           className="glass-light rounded-xl p-4 hover:neon-border transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-white text-sm">{robot.id}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                            ${robot.status === 'delivering' ? 'bg-emerald-500/10 text-emerald-400'
                             : robot.status === 'idle'      ? 'bg-aura-500/10 text-aura-300'
                                                            : 'bg-amber-500/10 text-amber-400'}`}>
                            {robot.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500
                              ${robot.battery > 60 ? 'bg-emerald-400'
                               : robot.battery > 30 ? 'bg-amber-400' : 'bg-red-400'}`}
                                 style={{ width: `${robot.battery}%` }} />
                          </div>
                          <span className="text-xs text-dark-500 w-10 text-right">
                            {robot.battery}%
                          </span>
                        </div>
                        <p className="text-xs text-dark-500 mt-1.5">{robot.deliveries} deliveries today</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════ TAB: MANAGE MENU ══════════════════════ */}
        {activeTab === 'menu' && (
          <div className="flex-1 px-6 lg:px-8 pb-8 grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Add New Item Form (left col) ── */}
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-6 sticky top-24">
                <h2 className="font-display text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Plus size={20} className="text-aura-400" />
                  Add Menu Item
                </h2>
                <p className="text-dark-400 text-xs mb-6">
                  New items appear on the Robot UI immediately.
                </p>

                {!isAdmin && (
                  <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-300">
                    Menu management is locked. Log in with admin credentials to add or remove items.
                  </div>
                )}

                {/* [BACKEND INTEGRATION: TODO] - POST /api/menu
                    On submit, call axiosInstance.post('/menu', { name, description, price, category, prepTime, imageUrl, imagePublicId }).
                    imageUrl/imagePublicId should come from media upload API below. */}
                <form onSubmit={handleAddItem} className="space-y-4">

                  {/* Item name */}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">
                      Item Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="menu-form-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={!isAdmin}
                      placeholder="e.g. Grilled Sea Bass"
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                                 text-white placeholder-dark-500 text-sm
                                 focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20
                                 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="menu-form-description"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      disabled={!isAdmin}
                      placeholder="e.g. Slow-cooked lamb with rosemary and garlic butter."
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                                 text-white placeholder-dark-500 text-sm resize-none
                                 focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20
                                 transition-all"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">
                      Price (USD) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-bold">$</span>
                      <input
                        id="menu-form-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        disabled={!isAdmin}
                        placeholder="0.00"
                        className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-8 pr-4 py-3
                                   text-white placeholder-dark-500 text-sm
                                   focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20
                                   transition-all"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Category</label>
                    <select
                      id="menu-form-category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      disabled={!isAdmin}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                                 text-white text-sm focus:outline-none focus:border-aura-500
                                 focus:ring-2 focus:ring-aura-500/20 transition-all"
                    >
                      {MENU_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Prep time */}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Prep Time</label>
                    <input
                      id="menu-form-time"
                      type="text"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      disabled={!isAdmin}
                      placeholder="e.g. 12 min"
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                                 text-white placeholder-dark-500 text-sm
                                 focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20
                                 transition-all"
                    />
                  </div>

                  {/* Image picker - Two options: Predefined or Upload */}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">
                      Image <span className="text-red-400">*</span>
                    </label>
                    
                    {/* Option toggle */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setImageMode('preset')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          imageMode === 'preset' 
                            ? 'bg-aura-600 text-white' 
                            : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                        }`}
                      >
                        📷 Choose Preset
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMode('upload')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          imageMode === 'upload' 
                            ? 'bg-aura-600 text-white' 
                            : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                        }`}
                      >
                        📤 Upload New
                      </button>
                    </div>

                    {/* Preset image selector */}
                    {imageMode === 'preset' && (
                      <>
                        <select
                          id="menu-form-image"
                          value={form.imageFilename}
                          onChange={(e) => setForm({ ...form, imageFilename: e.target.value })}
                          disabled={!isAdmin}
                          className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                                     text-white text-sm focus:outline-none focus:border-aura-500
                                     focus:ring-2 focus:ring-aura-500/20 transition-all"
                        >
                          {AVAILABLE_MENU_IMAGES.map((imageName) => (
                            <option key={imageName} value={imageName}>{imageName}</option>
                          ))}
                        </select>
                        <p className="text-xs text-dark-500 mt-2 truncate">Selected: {form.imageFilename}</p>
                        <div className="mt-3 overflow-hidden rounded-xl border border-dark-600 bg-dark-800">
                          <img
                            src={getMenuImageSrc(form.imageFilename)}
                            alt={form.name || 'Selected menu preview'}
                            className="w-full h-36 object-cover"
                          />
                        </div>
                      </>
                    )}

                    {/* File upload input */}
                    {imageMode === 'upload' && (
                      <>
                        <input
                          type="file"
                          id="menu-form-image-upload"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setForm({ ...form, imageFile: file });
                            }
                          }}
                          disabled={!isAdmin}
                          className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                                     text-white text-sm file:mr-4 file:py-2 file:px-4
                                     file:rounded-lg file:border-0 file:bg-aura-600 file:text-white
                                     file:cursor-pointer file:transition-all hover:file:bg-aura-500
                                     focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20"
                        />
                        {form.imageFile && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-dark-600 bg-dark-800">
                            <img
                              src={URL.createObjectURL(form.imageFile)}
                              alt="Uploaded preview"
                              className="w-full h-36 object-cover"
                            />
                          </div>
                        )}
                        <p className="text-xs text-dark-500 mt-2">
                          Uploaded: {form.imageFile?.name || 'No file selected'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Error / success */}
                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                      ⚠️ {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400">
                      ✅ {formSuccess}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    id="menu-form-submit"
                    type="submit"
                    disabled={!isAdmin}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-aura-600 to-aura-500
                               hover:from-aura-500 hover:to-aura-400 text-white font-bold text-sm
                               shadow-lg shadow-aura-600/20 active:scale-95 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                               flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Add to Menu
                  </button>
                </form>
              </div>
            </div>

            {/* ── Current Menu List (right col) ── */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <UtensilsCrossed size={20} className="text-aura-400" />
                  Current Menu
                </h2>
                <span className="text-sm text-dark-400">{menuItems.length} items</span>
              </div>

              {/* Group by category */}
              {MENU_CATEGORIES.map(({ value: cat, label: catLabel }) => {
                const items = menuItems.filter((i) => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-dark-500 mb-3 px-1">
                      {catLabel}
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          id={`admin-menu-row-${item.id}`}
                          className="glass-light rounded-xl px-4 py-3 flex items-center gap-4
                                     hover:border-white/10 transition-all group"
                        >
                          <img
                            src={getMenuImageSrc(item.imageFilename)}
                            alt={item.name}
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-white/10"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                            <p className="text-xs text-dark-400 leading-5 max-h-10 overflow-hidden mt-0.5">
                              {item.description || 'No description yet.'}
                            </p>
                            <p className="text-xs text-dark-500 mt-1">⏱ {item.time}</p>
                          </div>
                          <span className="text-base font-bold text-aura-400 flex-shrink-0">
                            ${item.price.toFixed(2)}
                          </span>
                          {/* Delete */}
                          {/* [BACKEND INTEGRATION: TODO] - DELETE /api/menu/{item.id} */}
                          <button
                            id={`delete-item-${item.id}`}
                            disabled={!isAdmin}
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className={`${isAdmin ? 'opacity-0 group-hover:opacity-100' : 'opacity-40 cursor-not-allowed'} w-8 h-8 rounded-lg
                                       hover:bg-red-500/20 text-dark-500 hover:text-red-400
                                       transition-all flex items-center justify-center flex-shrink-0`}
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
