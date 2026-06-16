/**
 * ============================================================
 *  AURA Restaurant System — Staff Management Page
 * ============================================================
 *  List existing staff/kitchen/admin accounts and add new ones.
 * ============================================================
 */

import { useState, useEffect } from 'react';
import { Users, Plus, RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { getStaffList, registerStaff } from '../../api/staffAPI';

const ROLES = [
  { value: 'STAFF',   label: 'Staff'   },
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'ADMIN',   label: 'Admin'   },
];

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '', password: '', firstName: '', lastName: '',
    email: '', phone: '', role: 'STAFF',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStaffList();
      setStaff(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.username.trim()) return setFormError('Username is required.');
    if (form.password.length < 8) return setFormError('Password must be at least 8 characters.');
    if (!form.firstName.trim() || !form.lastName.trim()) return setFormError('First and last name are required.');

    setSubmitting(true);
    try {
      await registerStaff(form);
      setFormSuccess(`"${form.username}" added as ${form.role}.`);
      setForm({ username: '', password: '', firstName: '', lastName: '', email: '', phone: '', role: 'STAFF' });
      await loadStaff();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 lg:px-8 pt-8 pb-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
              <Users className="text-aura-400" size={28} />
              Staff
            </h1>
            <p className="text-dark-400 mt-1 text-sm">
              Manage staff, kitchen, and admin accounts
            </p>
          </div>
          <button
            onClick={loadStaff}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                bg-white/5 hover:bg-white/10 text-dark-300 hover:text-white
                text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex-1 px-6 lg:px-8 pb-8 grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Add staff form */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Plus size={20} className="text-aura-400" />
                Add Staff Member
              </h2>
              <p className="text-dark-400 text-xs mb-6">
                Creates a new login account immediately.
              </p>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">First Name *</label>
                    <input
                      type="text" value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                                 text-white placeholder-dark-500 text-sm
                                 focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Last Name *</label>
                    <input
                      type="text" value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                                 text-white placeholder-dark-500 text-sm
                                 focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Username *</label>
                  <input
                    type="text" value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g. chef_bob"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                               text-white placeholder-dark-500 text-sm
                               focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Password *</label>
                  <input
                    type="password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                               text-white placeholder-dark-500 text-sm
                               focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
                  <input
                    type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. bob@aura.com"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                               text-white placeholder-dark-500 text-sm
                               focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Phone</label>
                  <input
                    type="text" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 123-456-7890"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                               text-white placeholder-dark-500 text-sm
                               focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                               text-white text-sm focus:outline-none focus:border-aura-500
                               focus:ring-2 focus:ring-aura-500/20"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-aura-600 to-aura-500
                             hover:from-aura-500 hover:to-aura-400 text-white font-bold text-sm
                             shadow-lg shadow-aura-600/20 active:scale-95 transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Staff Member'}
                </button>
              </form>
            </div>
          </div>

          {/* Staff list */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-aura-400" />
                Current Staff
              </h2>
              <span className="text-sm text-dark-400">{staff.length} accounts</span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
                ⚠️ {error}
              </div>
            )}

            {loading ? (
              <Card hover={false} className="h-32 animate-pulse" />
            ) : staff.length === 0 ? (
              <Card hover={false} className="text-center py-10 text-sm text-dark-500">
                No staff accounts yet.
              </Card>
            ) : (
              <div className="space-y-2">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="glass-light rounded-xl px-4 py-3 flex items-center gap-4 hover:border-white/10 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-sm font-bold text-aura-300 flex-shrink-0">
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-dark-400 truncate">
                        @{member.username} {member.email ? `· ${member.email}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0
                      ${member.role === 'ADMIN' ? 'bg-aura-500/10 text-aura-300'
                      : member.role === 'KITCHEN' ? 'bg-cyan-500/10 text-cyan-400'
                      : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {member.role}
                    </span>
                    {!member.active && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 flex-shrink-0">
                        Inactive
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}