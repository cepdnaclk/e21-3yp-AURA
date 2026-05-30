/**
 * ============================================================
 *  AURA Restaurant System — Restaurant Context
 * ============================================================
 *  Single source of truth for ALL order state.
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  ROOT CAUSE FIX — Cross-Tab Sync                        │
 *  │                                                         │
 *  │  React Context lives only in ONE tab's memory.          │
 *  │  Robot UI (table1 tab) and Kitchen Display (kitchen     │
 *  │  tab) are SEPARATE browser tabs → separate memory →     │
 *  │  they can't share a React Context instance directly.    │
 *  │                                                         │
 *  │  Solution: persist state to localStorage on every       │
 *  │  change, and listen to the browser's `storage` event    │
 *  │  to reload state when another tab writes to it.         │
 *  │                                                         │
 *  │  When backend is ready, replace the localStorage layer  │
 *  │  with a WebSocket subscription:                         │
 *  │  // [FUTURE WEBSOCKET/API] /api/orders/sync             │
 *  └─────────────────────────────────────────────────────────┘
 *
 *  Data flow:
 *    Robot UI  → placeOrder()           → localStorage → KDS reads via storage event
 *    Kitchen   → acceptOrder()          → localStorage → Robot UI reads via storage event
 *    Kitchen   → markDelivered()        → localStorage → Robot UI shows "Delivered!"
 *    Robot UI  → markTablePaid()        → localStorage → Grand total resets to $0
 * ============================================================
 */
/**
 * ============================================================
 *  AURA Restaurant System — Restaurant Context
 * ============================================================
 *  Single source of truth for ALL order state.
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  ROOT CAUSE FIX — Cross-Tab Sync                        │
 *  │                                                         │
 *  │  React Context lives only in ONE tab's memory.          │
 *  │  Robot UI (table1 tab) and Kitchen Display (kitchen     │
 *  │  tab) are SEPARATE browser tabs → separate memory →     │
 *  │  they can't share a React Context instance directly.    │
 *  │                                                         │
 *  │  Solution: persist state to localStorage on every       │
 *  │  change, and listen to the browser's `storage` event    │
 *  │  to reload state when another tab writes to it.         │
 *  │                                                         │
 *  │  When backend is ready, replace the localStorage layer  │
 *  │  with a WebSocket subscription:                         │
 *  │  // [FUTURE WEBSOCKET/API] /api/orders/sync             │
 *  └─────────────────────────────────────────────────────────┘
 *
 *  Data flow:
 *    Robot UI  → placeOrder()           → localStorage → KDS reads via storage event
 *    Kitchen   → acceptOrder()          → localStorage → Robot UI reads via storage event
 *    Kitchen   → markDelivered()        → localStorage → Robot UI shows "Delivered!"
 *    Robot UI  → markTablePaid()        → localStorage → Grand total resets to $0
 * ============================================================
 */

// CHANGE 1: added useState to import
import {
  createContext, useContext, useCallback, useReducer, useEffect, useState,
} from 'react';
import orderAPI from '../api/orderAPI';
// ✅ FIXED: Removed STOMP WebSocket import to prevent connection failures
// Using MQTT (via KitchenDisplay) instead for real-time updates
// import { Client } from '@stomp/stompjs';

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY   = 'aura_restaurant_state';
const STORAGE_VER   = 1; // bump this to wipe stale data on breaking changes
const DAY_IN_MS     = 24 * 60 * 60 * 1000;

const INITIAL_STATE = { orderHistory: [], ticketCounter: 1 };

export const ORDER_STATUS = {
  PENDING:   'PENDING',    // Customer placed, kitchen hasn't accepted yet
  PREPARING: 'PREPARING',  // Kitchen accepted and is cooking
  READY:     'READY',      // Done cooking, robot picking up
  DELIVERED: 'DELIVERED',  // Robot delivered to table
  PAID:      'PAID',       // Payment completed
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: hydrate Date objects after JSON.parse (serialises createdAt as string)
// ─────────────────────────────────────────────────────────────────────────────
const hydrate = (raw) => ({
  ...raw,
  orderHistory: (raw.orderHistory || []).map((o) => ({
    ...o,
    createdAt: new Date(o.createdAt),
    deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : null,
    paidAt: o.paidAt ? new Date(o.paidAt) : null,
  })),
  ticketCounter: raw.ticketCounter || 1,
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: read initial state from localStorage (or use empty state)
// ─────────────────────────────────────────────────────────────────────────────
function loadInitialState() {
  // We keep this function for structure, but WebSocket will provide the truth.
  return INITIAL_STATE;
}

function normalizeBackendOrder(raw) {
  return {
    id: raw.orderId,
    tableNumber: raw.tableId != null ? `T${raw.tableId}` : 'T?',
    ticketNum: raw.orderId,
    items: (raw.items || []).map((item) => ({
      id: item.menuItemId,
      name: item.menuItemName,
      quantity: item.quantity,
      price: item.subtotal && item.quantity ? item.subtotal / item.quantity : 0,
      imageFilename: item.imageUrl || item.menuItemImageUrl || '',
      customization: item.customization || '',
    })),
    status: raw.status,
    total: raw.totalAmount || 0,
    isPaid: false,
    isAddon: false,
    createdAt: raw.orderTime ? new Date(raw.orderTime) : new Date(),
    deliveredAt: raw.deliveredAt ? new Date(raw.deliveredAt) : null,
    paidAt: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reducer — pure state transitions
// ─────────────────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case 'PLACE_ORDER': {
      const order = action.payload.order;
      // ✅ FIXED: Prevent duplicate orders by checking if already exists
      const alreadyExists = state.orderHistory.some(o => o.id === order.id);
      if (alreadyExists) {
        console.log('⚠️ Order already exists, skipping duplicate:', order.id);
        return state;
      }
      return {
        ...state,
        orderHistory: [...state.orderHistory, order],
        ticketCounter: Math.max(state.ticketCounter + 1, order.ticketNum + 1),
      };
    }

    case 'SET_ORDERS': {
      return {
        ...state,
        orderHistory: action.payload.orderHistory,
        ticketCounter: Math.max(state.ticketCounter, action.payload.nextTicketNum || state.ticketCounter),
      };
    }

    case 'UPDATE_ORDER_STATUS': {
      return {
        ...state,
        orderHistory: state.orderHistory.map((o) =>
          o.id === action.payload.orderId
            ? {
              ...o,
              status: action.payload.status,
              deliveredAt:
                action.payload.status === ORDER_STATUS.DELIVERED
                  ? (o.deliveredAt || new Date())
                  : o.deliveredAt,
            }
            : o
        ),
      };
    }

    case 'MARK_TABLE_PAID': {
      return {
        ...state,
        orderHistory: state.orderHistory.map((o) =>
          o.tableNumber === action.payload.tableNumber && !o.isPaid
            ? { ...o, isPaid: true, paidAt: new Date(), status: ORDER_STATUS.PAID }
            : o
        ),
      };
    }

    case 'CANCEL_ORDER': {
      return {
        ...state,
        orderHistory: state.orderHistory.filter((o) => o.id !== action.payload.orderId),
      };
    }

    case 'SYNC_FROM_STORAGE': {
      return hydrate(action.payload);
    }

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context + Provider
// ─────────────────────────────────────────────────────────────────────────────
const RestaurantContext = createContext(null);

export function RestaurantProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [deliveredHistory, setDeliveredHistory] = useState([]);

  // ── [WEBSOCKET DISABLED - USE MQTT INSTEAD] ─────────────────────────────────
  // ✅ FIXED: Removed WebSocket to avoid duplicate orders from dual channels
  // MQTT (via KitchenDisplay + orderAPI.placeOrder) is the single source of truth
  // 
  // WebSocket was causing:
  //   1. Silent failures when ws://localhost:8080/ws doesn't exist
  //   2. Duplicate orders when both WebSocket and MQTT fire
  //   3. Race conditions between multiple subscription sources
  //
  // New approach: REST API (placeOrder) + MQTT notifications (real-time) only
  useEffect(() => {
    // WebSocket connection disabled — will be re-enabled only if backend has proper /ws endpoint
    // For now, rely on:
    //   - REST API for order placement (synchronous)
    //   - MQTT for real-time kitchen notifications (via orderMqtt in KitchenDisplay)
    //   - refreshOrders() to sync state when needed
    return () => {};
  }, []);

  // ── Load all active orders from backend on mount ──────────────────────────
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const backendOrders = await orderAPI.getAllOrders();
        const normalized = backendOrders.map(normalizeBackendOrder);
        dispatch({ type: 'SET_ORDERS', payload: { orderHistory: normalized } });
      } catch (error) {
        console.warn('[AURA] Could not load orders from backend:', error.message || error);
      }
    };

    loadOrders();
  }, []);

  // CHANGE 3: load delivered history from backend on mount
  // [API ENDPOINT]: GET /api/orders/history?hours=24
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const raw = await orderAPI.getDeliveredHistory(24);
        const normalized = raw.map(normalizeBackendOrder);
        setDeliveredHistory(normalized);
      } catch (error) {
        console.warn('[AURA] Could not load delivered history:', error.message || error);
      }
    };
    loadHistory();
  }, []);

  // ── Selectors (pure derivations from state) ───────────────────────────────

  /** Unpaid orders for a specific table */
  const getUnpaidOrders = useCallback(
    (tableNumber) =>
      state.orderHistory.filter((o) => o.tableNumber === tableNumber && !o.isPaid),
    [state.orderHistory]
  );

  /** Sum of all unpaid order totals for a table — used for Grand Total display */
  const getUnpaidTotal = useCallback(
    (tableNumber) => getUnpaidOrders(tableNumber).reduce((s, o) => s + o.total, 0),
    [getUnpaidOrders]
  );

  /** Most recent unpaid order for a table — drives the status badge on Robot UI */
  const getLatestOrder = useCallback((tableNumber) => {
    const orders = state.orderHistory.filter(
      (o) => o.tableNumber === tableNumber && !o.isPaid
    );
    return orders.length ? orders[orders.length - 1] : null;
  }, [state.orderHistory]);

  /**
   * [API ENDPOINT]: GET /api/v1/admin/revenue?status=PAID
   * [DATA SYNC]: Derives confirmed revenue from persistent paid orders shared by Robot, Kitchen, and Admin views.
   */
  const getConfirmedRevenue = useCallback(
    () => state.orderHistory.filter((o) => o.isPaid).reduce((s, o) => s + o.total, 0),
    [state.orderHistory]
  );

  /**
   * [API ENDPOINT]: GET /api/v1/admin/stats
   * [DATA SYNC]: Tracks unpaid kitchen-confirmed value separately so pending totals never pollute confirmed revenue.
   */
  const getPendingOrderTotal = useCallback(
    () => state.orderHistory.filter((o) => !o.isPaid).reduce((s, o) => s + o.total, 0),
    [state.orderHistory]
  );

  // CHANGE 4: replaced local filter with backend data
  // [API ENDPOINT]: GET /api/orders/history?hours=24
  // [DATA SYNC]: Real DB data — survives refresh and works across devices.
  const getDeliveredHistory24h = useCallback(() => {
    return deliveredHistory;
  }, [deliveredHistory]);

  /**
   * All in-flight orders across tables — displayed on KDS.
   */
  const activeOrders = state.orderHistory.filter((o) => o.status !== ORDER_STATUS.DELIVERED);

  // ── Mutators ──────────────────────────────────────────────────────────────

  const placeOrder = useCallback(async (tableNumber, items, isAddon = false) => {
    const tableId = Number(String(tableNumber).replace(/\D/g, '')) || 1;
    const payload = {
      tableId: tableId,
      items: items.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await orderAPI.placeOrder(payload);
      const order = normalizeBackendOrder(response);

      
      // ✅ FIXED: Check if order already exists before adding (deduplication)
      const orderExists = state.orderHistory.some(o => o.id === order.id);
      if (!orderExists) {
        dispatch({ type: 'PLACE_ORDER', payload: { order } });
        console.log('✅ Order added to state:', order.id);
      } else {
        console.log('ℹ️ Order already exists in state:', order.id);
      }
      return order;
    } catch (error) {
      console.error('[AURA] Failed to place order:', error.response?.data || error.message || error);
      throw error;
    }
  }, [state.orderHistory]);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    try {
      await orderAPI.updateOrderStatus(orderId, status);
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
    } catch (error) {
      console.error('[AURA] Failed to update order status:', error.response?.data || error.message || error);
      throw error;
    }
  }, []);

  const acceptOrder = useCallback((id) => updateOrderStatus(id, ORDER_STATUS.PREPARING), [updateOrderStatus]);
  const markReady   = useCallback((id) => updateOrderStatus(id, ORDER_STATUS.READY),     [updateOrderStatus]);

  // CHANGE 5: markDelivered now refreshes history from backend after delivery
  const markDelivered = useCallback(async (id) => {
    await updateOrderStatus(id, ORDER_STATUS.DELIVERED);
    try {
      const raw = await orderAPI.getDeliveredHistory(24);
      setDeliveredHistory(raw.map(normalizeBackendOrder));
    } catch (e) {
      console.warn('[AURA] Could not refresh delivered history:', e.message);
    }
  }, [updateOrderStatus]);

  const cancelOrder = useCallback((orderId) => {
    // [API ENDPOINT]: DELETE /api/v1/orders/:orderId (not available in backend yet)
    dispatch({ type: 'CANCEL_ORDER', payload: { orderId } });
  }, []);

  // Refresh orders from backend (used by MQTT callbacks)
  // const refreshOrders = useCallback(async () => {
  //   try {
  //     const backendOrders = await orderAPI.getAllOrders();
  //     const normalized = backendOrders.map(normalizeBackendOrder);
      
  //     // ✅ FIXED: Merge with existing orders to prevent loss of local state
  //     // Only add orders from backend that don't already exist in state
  //     const newOrders = normalized.filter(
  //       backendOrder => !state.orderHistory.some(o => o.id === backendOrder.id)
  //     );
      
  //     if (newOrders.length > 0) {
  //       console.log(`📥 ${newOrders.length} new orders from backend`);
  //       newOrders.forEach(o => {
  //         dispatch({ type: 'PLACE_ORDER', payload: { order: o } });
  //       });
  //     } else {
  //       console.log('✅ Orders already synced');
  //     }
  //   } catch (error) {
  //     console.warn('[AURA] Failed to refresh orders:', error.message);
  //   }
  // }, [state.orderHistory]);
  const refreshOrders = useCallback(async () => {
  try {
    const backendOrders = await orderAPI.getAllOrders();
    const normalized = backendOrders.map(normalizeBackendOrder);
    const existing = state.orderHistory;
    const merged = normalized.map((incoming) => {
      const old = existing.find(o => o.id === incoming.id);
      return old?.isPaid ? { ...incoming, isPaid: true, paidAt: old.paidAt } : incoming;
    });
    dispatch({ type: 'SET_ORDERS', payload: { orderHistory: merged } });
  } catch (error) {
    console.warn('[AURA] Failed to refresh orders:', error.message);
  }
}, [state.orderHistory]);

  const markTablePaid = useCallback(async (tableNumber) => {
    try {
      const tableId = Number(String(tableNumber).replace(/\D/g, '')) || 1;
      const tableLabel = `T${tableId}`;   // ← always "T1", "T2", etc.

      await orderAPI.markTableAsPaid(tableId);
      dispatch({ type: 'MARK_TABLE_PAID', payload: { tableNumber: tableLabel } }); // ← use tableLabel
      console.log(`✅ Table ${tableLabel} marked as paid`);
    } catch (error) {
      console.error(`Failed to mark table ${tableNumber} as paid:`, error.message || error);
      throw error;
    }
  }, []);

  const value = {
    orderHistory: state.orderHistory,
    activeOrders,
    getUnpaidOrders,
    getUnpaidTotal,
    getLatestOrder,
    getConfirmedRevenue,
    getPendingOrderTotal,
    getDeliveredHistory24h,
    placeOrder,
    updateOrderStatus,
    acceptOrder,
    markReady,
    markDelivered,
    cancelOrder,
    refreshOrders,
    markTablePaid,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used inside <RestaurantProvider>');
  return ctx;
}

export default RestaurantContext;