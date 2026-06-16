/**
 * ============================================================
 *  AURA Restaurant System — Admin Settings Page
 * ============================================================
 *  Account info + change password.
 * ============================================================
 */

import { useState } from 'react';
import { Settings, User, Lock } from 'lucide-react';
import Card from '../../components/common/Card';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { useAppContext } from '../../context/AppContext';
import { changePassword } from '../../api/settingsAPI';

export default function SettingsPage() {
  const { session } = useAppContext();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (form.newPassword !== form.confirmPassword) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setSuccess('Password changed successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 lg:px-8 pt-8 pb-4">
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="text-aura-400" size={28} />
            Settings
          </h1>
          <p className="text-dark-400 mt-1 text-sm">
            Account details and security
          </p>
        </div>

        <div className="flex-1 px-6 lg:px-8 pb-8 space-y-6 max-w-2xl">

          {/* Account info */}
          <Card hover={false} className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-dark-700/50">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <User size={18} className="text-aura-400" />
                Account Information
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">Username</span>
                <span className="text-sm font-medium text-white">{session?.username || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">Role</span>
                <span className="text-sm font-medium text-white capitalize">{session?.role || '—'}</span>
              </div>
            </div>
          </Card>

          {/* Change password */}
          <Card hover={false} className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-dark-700/50">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-amber-400" />
                Change Password
              </h2>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Current Password</label>
                <input
                  type="password" value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                             text-white placeholder-dark-500 text-sm
                             focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">New Password</label>
                <input
                  type="password" value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                             text-white placeholder-dark-500 text-sm
                             focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Confirm New Password</label>
                <input
                  type="password" value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3
                             text-white placeholder-dark-500 text-sm
                             focus:outline-none focus:border-aura-500 focus:ring-2 focus:ring-aura-500/20"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400">
                  ✅ {success}
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
                {submitting ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </Card>

        </div>

        <Footer />
      </div>
    </div>
  );
}