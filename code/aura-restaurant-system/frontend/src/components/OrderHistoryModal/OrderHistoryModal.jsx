// ============================================================
// OrderHistoryModal.jsx
// Table Orders History Popup Component
// ============================================================
// Import කරනවා - orderAPI.getOrdersByTable() use කරනවා
// ඒක ඔයාගේ orderAPI.js වල දැනටමත් ready!
// ============================================================

import React, { useState, useEffect } from "react";
import orderAPI from "../../api/orderAPI";   // ← ඔයාගේ existing orderAPI import
import "./OrderHistoryModal.css";

// ── Status Display Config ──────────────────────────────────
// සෑම status එකකටම icon, සිංහල label, color define කරනවා
const STATUS_CONFIG = {
  PENDING: {
    sinhala: "රැඳී සිටී",
    icon: "⏳",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fcd34d",
    dot: "#f59e0b",
  },
  PREPARING: {
    sinhala: "සකස් කරමින්",
    icon: "👨‍🍳",
    color: "#1d4ed8",
    bg: "#dbeafe",
    border: "#93c5fd",
    dot: "#3b82f6",
  },
  READY: {
    sinhala: "සූදානම්",
    icon: "✅",
    color: "#065f46",
    bg: "#d1fae5",
    border: "#6ee7b7",
    dot: "#10b981",
  },
  DELIVERED: {
    sinhala: "ලැබුණි",
    icon: "🚀",
    color: "#374151",
    bg: "#f3f4f6",
    border: "#d1d5db",
    dot: "#6b7280",
  },
};

// ── Date/Time Formatter ───────────────────────────────────
// Backend එකෙන් එන timestamp format කරනවා display සඳහා
const formatTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {   // DD/MM/YYYY HH:MM format
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ── Time Ago Calculator ───────────────────────────────────
// "2 minutes ago" style display
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000; // seconds
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// Props:
//   tableId  - ඔයාගේ table number (RobotUI context/props එකෙන් ගන්නවා)
//   onClose  - Modal close කරන function
// ════════════════════════════════════════════════════════════
const OrderHistoryModal = ({ tableId, onClose }) => {

  // ── State Variables ──────────────────────────────────────
  const [orders, setOrders]     = useState([]);      // API orders data
  const [loading, setLoading]   = useState(true);    // Loading spinner
  const [error, setError]       = useState(null);    // Error message
  const [filter, setFilter]     = useState("ALL");   // Status filter tab

  // ── API Call ─────────────────────────────────────────────
  // Component mount වෙනකොට orders fetch කරනවා
  // ඔයාගේ orderAPI.getOrdersByTable() use කරනවා - orderAPI.js line 47
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ ඔයාගේ existing API function call කරනවා
        // GET /api/orders/table/{tableId} → OrderController.java line 21
        const data = await orderAPI.getOrdersByTable(tableId);
        
        // orderTime අනුව newest first sort කරනවා
        const sorted = [...data].sort(
          (a, b) => new Date(b.orderTime) - new Date(a.orderTime)
        );
        setOrders(sorted);

      } catch (err) {
        setError("Orders ලබා ගැනීම අසාර්ථකයි. නැවත උත්සාහ කරන්න.");
        console.error("OrderHistoryModal fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (tableId) loadOrders();
  }, [tableId]);

  // ── Filter Logic ─────────────────────────────────────────
  // Tab filter කළ orders list
  const filteredOrders =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  // ── Summary Stats ────────────────────────────────────────
  // Summary cards සඳහා data calculate කරනවා
  // ඔයාගේ OrderResponse DTO fields: orderId, status, totalAmount, orderTime, deliveredAt
  const stats = {
    total:     orders.length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    active:    orders.filter((o) => ["PENDING","PREPARING","READY"].includes(o.status)).length,
    revenue:   orders
                 .filter((o) => o.status === "DELIVERED")
                 .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
  };

  // ── Backdrop Click Handler ───────────────────────────────
  // Modal background click කළොත් close වෙනවා
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ── Keyboard ESC Handler ─────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="ohm-overlay" onClick={handleBackdrop}>
      <div className="ohm-modal" role="dialog" aria-modal="true">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="ohm-header">
          <div className="ohm-header-info">
            <div className="ohm-header-icon">🍽️</div>
            <div>
              <h2 className="ohm-header-title">
                මේස {tableId} — ඇණවුම් ඉතිහාසය
              </h2>
              <p className="ohm-header-sub">Table {tableId} · Order History</p>
            </div>
          </div>
          <button className="ohm-btn-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* ── LOADING ─────────────────────────────────────── */}
        {loading && (
          <div className="ohm-center-state">
            <div className="ohm-spinner" />
            <p className="ohm-state-text">ඇණවුම් ලබා ගනිමින් පවතී...</p>
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────── */}
        {!loading && error && (
          <div className="ohm-center-state">
            <span className="ohm-state-icon">⚠️</span>
            <p className="ohm-state-text ohm-error-text">{error}</p>
            <button
              className="ohm-retry-btn"
              onClick={() => { setError(null); setLoading(true); }}
            >
              නැවත උත්සාහ කරන්න
            </button>
          </div>
        )}

        {/* ── EMPTY ───────────────────────────────────────── */}
        {!loading && !error && orders.length === 0 && (
          <div className="ohm-center-state">
            <span className="ohm-state-icon">📭</span>
            <p className="ohm-state-text">මෙම මේසයෙන් ඇණවුම් නොමැත</p>
            <p className="ohm-state-sub">No orders found for Table {tableId}</p>
          </div>
        )}

        {/* ── CONTENT (orders ඇති නම් show කරනවා) ──────────── */}
        {!loading && !error && orders.length > 0 && (
          <>
            {/* SUMMARY CARDS */}
            <div className="ohm-summary">
              <div className="ohm-stat-card">
                <span className="ohm-stat-num">{stats.total}</span>
                <span className="ohm-stat-lbl">සම්පූර්ණ</span>
              </div>
              <div className="ohm-stat-card ohm-stat-green">
                <span className="ohm-stat-num">{stats.delivered}</span>
                <span className="ohm-stat-lbl">ලැබුණු</span>
              </div>
              <div className="ohm-stat-card ohm-stat-amber">
                <span className="ohm-stat-num">{stats.active}</span>
                <span className="ohm-stat-lbl">ක්‍රියාකාරී</span>
              </div>
              <div className="ohm-stat-card ohm-stat-blue">
                <span className="ohm-stat-num">Rs.{stats.revenue}</span>
                <span className="ohm-stat-lbl">ලැබුණු ආදායම</span>
              </div>
            </div>

            {/* FILTER TABS - Status අනුව filter කරන්නයි */}
            <div className="ohm-tabs">
              {["ALL", "PENDING", "PREPARING", "READY", "DELIVERED"].map((tab) => {
                const cfg = STATUS_CONFIG[tab];
                const count = tab === "ALL"
                  ? orders.length
                  : orders.filter((o) => o.status === tab).length;
                return (
                  <button
                    key={tab}
                    className={`ohm-tab ${filter === tab ? "ohm-tab-active" : ""}`}
                    onClick={() => setFilter(tab)}
                    style={filter === tab && cfg ? { borderBottomColor: cfg.dot } : {}}
                  >
                    {cfg ? cfg.icon : "📋"}{" "}
                    {tab === "ALL" ? "සියල්ල" : cfg.sinhala}
                    <span className="ohm-tab-count">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* ORDERS TABLE */}
            <div className="ohm-table-wrap">
              {filteredOrders.length === 0 ? (
                <div className="ohm-filter-empty">
                  මෙම category එකේ orders නොමැත
                </div>
              ) : (
                <table className="ohm-table">
                  <thead>
                    <tr>
                      <th>ඇණ.#</th>
                      <th>ඇණවුම් වේලාව</th>
                      <th>තත්ත්වය</th>
                      <th>වටිනාකම</th>
                      <th>ලැබුණු වේලාව</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      // ── OrderResponse DTO fields use කරනවා ──
                      // orderId, status, totalAmount, orderTime, deliveredAt
                      const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                      return (
                        <tr key={order.orderId} className="ohm-row">

                          {/* Order ID */}
                          <td>
                            <span className="ohm-order-id">#{order.orderId}</span>
                          </td>

                          {/* Order Time + "5m ago" */}
                          <td>
                            <span className="ohm-time-main">
                              {formatTime(order.orderTime)}
                            </span>
                            <span className="ohm-time-ago">
                              {timeAgo(order.orderTime)}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td>
                            <span
                              className="ohm-badge"
                              style={{
                                color: cfg.color,
                                background: cfg.bg,
                                borderColor: cfg.border,
                              }}
                            >
                              <span
                                className="ohm-badge-dot"
                                style={{ background: cfg.dot }}
                              />
                              {cfg.icon} {cfg.sinhala}
                            </span>
                          </td>

                          {/* Amount */}
                          <td>
                            <span className="ohm-amount">
                              Rs. {order.totalAmount}
                            </span>
                          </td>

                          {/* Delivered At - DELIVERED orders වලට පමණයි */}
                          <td className="ohm-delivered-cell">
                            {order.status === "DELIVERED" ? (
                              <>
                                <span className="ohm-time-main">
                                  {formatTime(order.deliveredAt)}
                                </span>
                                <span className="ohm-time-ago">
                                  {timeAgo(order.deliveredAt)}
                                </span>
                              </>
                            ) : (
                              <span className="ohm-na">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── FOOTER ──────────────────────────────────────── */}
        <div className="ohm-footer">
          <span className="ohm-footer-note">
            ESC හෝ පිටතින් click කළත් වසෙයි
          </span>
          <button className="ohm-btn-done" onClick={onClose}>
            වසන්න ✕
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderHistoryModal;