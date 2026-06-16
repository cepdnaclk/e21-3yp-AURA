/**
 * ============================================================
 *  AURA — Kitchen Display System (KDS)
 * ============================================================
 *  Reads activeOrders from RestaurantContext.
 *  Kitchen staff click buttons here → Robot UI reacts instantly.
 *
 *  Columns: PENDING → PREPARING → READY → (DELIVERED)
 *
 *  [FUTURE WEBSOCKET/API] Each mutating action should also emit
 *  an event to /api/orders/sync so other clients stay in sync.
 * ============================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { ChefHat, Clock, Flame, Timer, CheckCircle2, X, ArrowRight, LogOut } from 'lucide-react';
import Footer from '../../components/layout/Footer';
import { useRestaurant, ORDER_STATUS } from '../../context/RestaurantContext';
import { useAppContext } from '../../context/AppContext';
import { getTimeSince } from '../../utils/helpers';
import { getMenuImageSrc } from '../../utils/menuImages';
import { orderMqtt } from '../../api/mqttclient';
//import { orderWebSocket } from '../../api/webSocket';

// ─── Column config ────────────────────────────────────────────────────────────
const COLS = [
  {
    key: ORDER_STATUS.PENDING,
    label: 'New Orders',
    headerBg: 'bg-sky-500/10', headerText: 'text-sky-400',
    cardBorder: 'border-sky-500/25 bg-sky-500/5',
    btnLabel: 'Accept & Prepare',
    btnClass: 'bg-amber-500 hover:bg-amber-400',
    nextStatus: ORDER_STATUS.PREPARING,
  },
  {
    key: ORDER_STATUS.PREPARING,
    label: 'Preparing',
    headerBg: 'bg-amber-500/10', headerText: 'text-amber-400',
    cardBorder: 'border-amber-500/25 bg-amber-500/5',
    btnLabel: 'Mark Ready →',
    btnClass: 'bg-emerald-500 hover:bg-emerald-400',
    nextStatus: ORDER_STATUS.READY,
  },
  {
    key: ORDER_STATUS.READY,
    label: 'Ready / Delivering',
    headerBg: 'bg-orange-500/10', headerText: 'text-orange-400',
    cardBorder: 'border-orange-500/25 bg-orange-500/5',
    btnLabel: 'Mark Delivered ✓',
    btnClass: 'bg-aura-600 hover:bg-aura-500',
    nextStatus: ORDER_STATUS.DELIVERED,
  },
];

export default function KitchenDisplay() {
  const { logout } = useAppContext();
  const {
    activeOrders,
    acceptOrder,
    markReady,
    markDelivered,
    cancelOrder,
    getDeliveredHistory24h,
    refreshOrders,
    waiterCalls,
    dismissWaiterCall,
    clearWaiterCalls,
  } = useRestaurant();


  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState('live');
  
  // Live clock for elapsed time
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // MQTT listener for new orders
  // useEffect(() => {
  //   // ✅ FIXED: Connect once and keep alive (don't disconnect on unmount)
  //   // Only ONE connection per app lifetime, not per component
  //   orderMqtt.connect();

  //   const unsubNewOrder = orderMqtt.onNewOrder(async (mqttData) => {
  //     console.log('🔔 New order notification via MQTT:', mqttData);
  //     // Refresh orders from backend to get full data
  //     // Only refresh for genuinely new orders (status PENDING)
  //     // Ignore status update echoes from kitchen's own actions
  //     if (mqttData?.status && mqttData.status !== 'PENDING') {
  //       console.log('⏭️ Skipping refresh — status update echo, not a new order');
  //       return;
  //     }
  //     await refreshOrders();

  //     const unsubWaiter = orderMqtt.onWaiterCall((data) => {
  //       console.log('🔔 Waiter call received:', data);
  //       setWaiterCalls(prev => [
  //         { ...data, id: Date.now(), seen: false },
  //         ...prev.slice(0, 9), // max 10 notifications
  //       ]);
  //     });

  //     // cleanup return
  //     return () => {
  //       unsubNewOrder();
  //       unsubWaiter();
  //     };
  //   });

  //   // ✅ FIXED: Only unsubscribe, don't disconnect entire MQTT service
  //   return () => {
  //     unsubNewOrder();
  //     // Don't call orderMqtt.disconnect() — it closes the connection for all listeners
  //   };
  // }, [refreshOrders]);


  // ✅ FIXED — waiter listener context එකේ, මෙතන only orders
useEffect(() => {
  orderMqtt.connect();

  const unsubNewOrder = orderMqtt.onNewOrder(async (mqttData) => {
    console.log('🔔 New order notification via MQTT:', mqttData);
    if (mqttData?.status && mqttData.status !== 'PENDING') {
      console.log('⏭️ Skipping refresh — status update echo');
      return;
    }
    await refreshOrders();
  });

  return () => {
    unsubNewOrder();
  };
}, [refreshOrders]);

  // Only show non-delivered tickets on KDS live board
  const liveOrders = activeOrders.filter((o) => o.status !== ORDER_STATUS.DELIVERED);
  const deliveredHistory24h = useMemo(() => getDeliveredHistory24h(), [getDeliveredHistory24h]);

  // [API ENDPOINT]: PATCH /api/v1/orders/:orderId/status
  // [DATA SYNC]: Kitchen status transitions are persisted once and reflected immediately for Robot and Admin views.
  const handleAction = (order, nextStatus) => {
    if (nextStatus === null)                         cancelOrder(order.id);
    else if (nextStatus === ORDER_STATUS.PREPARING)  acceptOrder(order.id);
    else if (nextStatus === ORDER_STATUS.READY)      markReady(order.id);
    else if (nextStatus === ORDER_STATUS.DELIVERED)  markDelivered(order.id);
  };

  const urgentMinutes = 5; // orders older than this get urgent styling

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-[#0a0a0a]">

      {/* ── KDS top bar ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#111] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <ChefHat size={20} className="text-white"/>
          </div>
          <div>
            <p className="font-display font-bold text-white text-lg leading-tight">Kitchen Display</p>
            <p className="text-xs text-gray-500">
              {liveOrders.length} active · {deliveredHistory24h.length} delivered in 24h
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
            <Timer size={15}/>
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button id="kitchen-logout" onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition-all active:scale-95">
            <LogOut size={14}/>Logout
          </button>
        </div>
      </div>

      {/* [API ENDPOINT]: GET /api/v1/orders/history?range=24h */}
      {/* [DATA SYNC]: Reads delivered order history from shared persistent state to keep 24-hour references stable across refresh/login. */}
      <div className="px-6 pt-5 pb-3 border-b border-white/5 flex items-center gap-2">
        {[
          { id: 'live', label: 'Live Board' },
          { id: 'history', label: 'Order History (24h)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              : 'text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10 border border-transparent'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Empty state ── */}
      {activeTab === 'live' && liveOrders.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-700 py-20">
          <ChefHat size={56} className="opacity-20 mb-4"/>
          <p className="text-lg font-semibold opacity-40">No active orders</p>
          <p className="text-sm opacity-25 mt-1">Orders placed by tables will appear here in real-time</p>
          <p className="text-xs opacity-20 mt-6 max-w-xs text-center">
            {/* [FUTURE WEBSOCKET/API] In production, connect via WebSocket to /api/orders/stream */}
            Context is synced — Robot UI orders appear here instantly without page reload.
          </p>
        </div>
      )}

      {/* ── Kanban board ── */}
      {activeTab === 'live' && liveOrders.length > 0 && (
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-5 overflow-auto">
          {COLS.map(col => {
            const colOrders = liveOrders.filter(o => o.status === col.key);
            return (
              <div key={col.key} className="flex flex-col gap-3">

                {/* Column header */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-2xl ${col.headerBg}`}>
                  <span className={`font-display font-bold text-base ${col.headerText}`}>{col.label}</span>
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full bg-white/10 ${col.headerText}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Empty column */}
                {colOrders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/8 py-10 text-center text-gray-700 text-sm">
                    No orders here
                  </div>
                )}

                {/* Order cards */}
                {colOrders.map(order => {
                  const ageMs  = Date.now() - new Date(order.createdAt).getTime();
                  const urgent = ageMs > urgentMinutes * 60000;

                  return (
                    <div key={order.id} id={`kds-${order.id}`}
                      className={`rounded-2xl border overflow-hidden transition-all duration-300
                                  ${col.cardBorder}
                                  ${urgent ? 'ring-2 ring-red-500/50 shadow-lg shadow-red-500/10' : ''}`}>

                      {/* Card header */}
                      <div className={`px-4 py-3 flex items-center justify-between ${col.headerBg}`}>
                        <div className="flex items-center gap-2">
                          {/* Table badge */}
                          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                            {order.tableNumber}
                          </div>
                          <div>
                            <p className="text-xs font-mono text-gray-400 leading-tight">#{order.id}</p>
                            {order.isAddon && (
                              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-semibold">ADD-ON</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {urgent && <Flame size={14} className="text-red-400 animate-pulse" title="Urgent"/>}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={11}/>{getTimeSince(order.startTime || order.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="px-4 py-3 space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <img
                              src={getMenuImageSrc(item.MenuImageUrl || item.imageFilename || item.menuItemImageUrl)}
                              alt={item.name}
                              className="w-8 h-8 rounded-lg object-cover border border-white/10"
                            />
                            <span className="text-amber-400 font-bold min-w-[1.5rem]">{item.quantity}×</span>
                            <span className="text-gray-200">{item.name}</span>
                          </div>
                        ))}
                        <div className="pt-1 flex justify-between text-xs text-gray-600 border-t border-white/5 mt-1">
                          <span>{order.items.reduce((s,i) => s+i.quantity, 0)} items</span>
                          <span className="text-orange-400 font-medium">${order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {/* [FUTURE WEBSOCKET/API] Each button should also emit to      */}
                      {/* /api/orders/sync so Robot UI gets update in production      */}
                      {/* [BACKEND INTEGRATION: TODO] PUT /api/orders/:id/status      */}
                      <div className="px-4 pb-4 flex items-center gap-2">
                        {/* Cancel/remove */}
                        <button id={`kds-cancel-${order.id}`}
                          onClick={() => handleAction(order, null)}
                          title="Remove ticket"
                          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-all flex items-center justify-center">
                          <X size={15}/>
                        </button>
                        {/* Advance */}
                        <button id={`kds-advance-${order.id}`}
                          onClick={() => handleAction(order, col.nextStatus)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-lg ${col.btnClass}`}>
                          {col.btnLabel}
                          <ArrowRight size={14}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 24-hour history ── */}
      {activeTab === 'history' && (
        <div className="flex-1 px-6 py-5 overflow-auto">
          {deliveredHistory24h.length === 0 ? (
            <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-white/10 text-gray-600 text-sm">
              No delivered orders found in the last 24 hours.
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                <CheckCircle2 size={14}/> Delivered Orders (Last 24 Hours)
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {deliveredHistory24h.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">Order ID: {order.id}</p>
                        <p className="text-xs text-gray-400">Table: {order.tableNumber}</p>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium">
                        Delivered at {new Date(order.deliveredAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


      {/* ── Right Sidebar: Waiter Calls ── */}
    <div className="w-72 flex-shrink-0 border-l border-white/5 flex flex-col bg-[#0d0d0d]">
      
      {/* Sidebar Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <p className="font-bold text-white text-sm">Waiter Calls</p>
          </div>
          {waiterCalls.filter(c => !c.seen).length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
              {waiterCalls.filter(c => !c.seen).length} new
            </span>
          )}
        </div>
      </div>

      {/* Calls List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {waiterCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-700 py-10">
            <span className="text-3xl mb-2">🔔</span>
            <p className="text-xs text-center opacity-50">No waiter calls yet</p>
          </div>
        ) : (
          waiterCalls.map(call => (
            <div
              key={call.id}
              className={`rounded-xl p-3 border transition-all ${
                call.seen
                  ? 'bg-white/3 border-white/5'
                  : 'bg-yellow-500/10 border-yellow-500/25'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-400 flex-shrink-0">
                    {call.tableNumber}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{call.message}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {new Date(call.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {/* Mark as seen */}
                <button
                  onClick={() => dismissWaiterCall(call.id)}
                  className="w-6 h-6 rounded-md bg-white/5 hover:bg-green-500/20 text-gray-600 hover:text-green-400 transition-all flex items-center justify-center flex-shrink-0 text-xs"
                >
                  ✓
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear all button */}
      {waiterCalls.length > 0 && (
        <div className="p-3 border-t border-white/5">
          <button
            onClick={clearWaiterCalls}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-gray-300 text-xs font-medium transition-all"
          >
            Clear All
          </button>
        </div>
      )}

    </div>

      <Footer/>
    </div>
  );
}
