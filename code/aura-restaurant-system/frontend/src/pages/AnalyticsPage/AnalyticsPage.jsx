/**
 * ============================================================
 *  AURA Restaurant System — Analytics Page
 * ============================================================
 *  Shows live stats from /api/admin/stats and /api/admin/revenue,
 *  plus order breakdowns computed from RestaurantContext.
 * ============================================================
 */

import { useState, useEffect } from 'react';
import {
  BarChart3, DollarSign, ShoppingBag, Clock, TrendingUp, RefreshCw,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { formatPrice } from '../../utils/helpers';
import { useRestaurant } from '../../context/RestaurantContext';
import { getAdminStats, getRevenue } from '../../api/adminAPI';

export default function AnalyticsPage() {
  const { activeOrders, orderHistory } = useRestaurant();

  const [stats, setStats] = useState(null);
  const [pendingRevenue, setPendingRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, pendingData] = await Promise.all([
        getAdminStats(),
        getRevenue('pending'),
      ]);
      setStats(statsData);
      setPendingRevenue(pendingData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 60s so stats stay current without manual reload
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Order status breakdown (computed client-side from context data) ──────
  const allOrders = [...activeOrders, ...orderHistory]
    .filter((o, idx, arr) => arr.findIndex((x) => x.id === o.id) === idx);

  const statusCounts = allOrders.reduce((acc, order) => {
    const key = (order.status || 'unknown').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // ── Top items by quantity sold ────────────────────────────────────────────
  const itemCounts = {};
  allOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 0);
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const statCards = stats ? [
    {
      label: 'Confirmed Revenue',
      value: formatPrice(stats.confirmedRevenue),
      icon: DollarSign,
      color: 'from-emerald-500 to-green-400',
    },
    {
      label: 'Pending Revenue',
      value: formatPrice(pendingRevenue?.total ?? 0),
      icon: ShoppingBag,
      color: 'from-cyan-500 to-blue-400',
    },
    {
      label: 'Active Orders',
      value: stats.activeOrders,
      icon: ShoppingBag,
      color: 'from-aura-500 to-aura-400',
    },
    {
      label: 'Avg Delivery Time',
      value: stats.avgDeliveryMins > 0 ? `${stats.avgDeliveryMins} min` : '—',
      icon: Clock,
      color: 'from-amber-500 to-yellow-400',
    },
  ] : [];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between px-6 lg:px-8 pt-8 pb-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="text-aura-400" size={28} />
              Analytics
            </h1>
            <p className="text-dark-400 mt-1 text-sm">
              Restaurant performance overview
              {lastUpdated && (
                <span className="text-dark-500">
                  {' '}· Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                bg-white/5 hover:bg-white/10 text-dark-300 hover:text-white
                text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex-1 px-6 lg:px-8 space-y-8 pb-8">

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              ⚠️ {error}
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading && !stats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} hover={false} className="h-32 animate-pulse" />
              ))
            ) : (
              statCards.map((stat) => {
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
              })
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Order status breakdown */}
            <Card hover={false} className="p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-dark-700/50">
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag size={18} className="text-aura-400" />
                  Order Status Breakdown
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {Object.keys(statusCounts).length === 0 ? (
                  <p className="text-sm text-dark-500 text-center py-6">No orders yet.</p>
                ) : (
                  Object.entries(statusCounts).map(([status, count]) => {
                    const pct = Math.round((count / allOrders.length) * 100);
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white capitalize">{status}</span>
                          <span className="text-sm text-dark-400">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-aura-500 to-aura-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Top items */}
            <Card hover={false} className="p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-dark-700/50">
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-400" />
                  Top Selling Items
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {topItems.length === 0 ? (
                  <p className="text-sm text-dark-500 text-center py-6">No order data yet.</p>
                ) : (
                  topItems.map(([name, qty], idx) => (
                    <div key={name} className="flex items-center gap-4">
                      <div className="w-7 h-7 rounded-lg bg-dark-700 flex items-center justify-center text-xs font-bold text-aura-300 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="flex-1 text-sm text-white truncate">{name}</span>
                      <span className="text-sm font-bold text-aura-400">{qty} sold</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}