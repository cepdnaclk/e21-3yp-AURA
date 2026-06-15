/**
 * ============================================================
 *  AURA Restaurant System — Admin Sidebar
 * ============================================================
 *  Collapsible sidebar for the admin layout.
 *  Only shown when role = 'admin'.
 *
 *  Future nav items (Analytics, Staff, Inventory, Settings) are
 *  disabled until backend endpoints are ready.
 * ============================================================
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ChefHat, Settings, BarChart3,
  Users, Package, ChevronLeft, ChevronRight, UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';

const MENU_ITEMS = [
  { path: '/admin',   label: 'Dashboard',      icon: LayoutDashboard },
  { path: '/kitchen', label: 'Kitchen Display', icon: ChefHat         },
  { type: 'divider' },
  // Disabled until backend analytics endpoint is ready
  // [BACKEND INTEGRATION: TODO] - GET /api/analytics → enable Analytics page
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3,      disabled: true },
  // [BACKEND INTEGRATION: TODO] - GET /api/staff    → enable Staff page
  { path: '/admin/staff',     label: 'Staff',      icon: Users,          disabled: true },
  // [BACKEND INTEGRATION: TODO] - GET /api/inventory → enable Inventory page
  { path: '/admin/inventory', label: 'Inventory',  icon: Package,        disabled: true },
  { type: 'divider' },
  // [BACKEND INTEGRATION: TODO] - GET /api/settings → enable Settings page
  { path: '/admin/settings',  label: 'Settings',   icon: Settings,       disabled: true },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`glass h-[calc(100vh-4rem)] sticky top-16 border-r border-dark-700/50
                  transition-all duration-300 ease-out flex-shrink-0
                  ${collapsed ? 'w-16' : 'w-60'}`}
    >
      <div className="flex flex-col h-full p-3">

        {/* Collapse toggle */}
        <button
          id="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          className="self-end mb-4 p-1.5 rounded-lg hover:bg-dark-700/50
                     text-dark-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1">
          {MENU_ITEMS.map((item, i) => {
            if (item.type === 'divider') {
              return <hr key={i} className="border-dark-700/50 my-2" />;
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.disabled ? '#' : item.path}
                id={`sidebar-link-${item.label.toLowerCase().replace(' ', '-')}`}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                  ${isActive && !item.disabled
                    ? 'bg-aura-600/20 text-aura-300 border border-aura-500/20'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700/50'}
                `}
                onClick={(e) => item.disabled && e.preventDefault()}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.disabled && (
                  <span className="ml-auto text-[10px] text-dark-600 font-normal">soon</span>
                )}
              </NavLink>
            );
          })}
        </nav>

      </div>
    </aside>
  );
}
