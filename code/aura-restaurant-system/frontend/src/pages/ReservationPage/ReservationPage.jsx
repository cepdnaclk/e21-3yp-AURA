import { useState, useEffect } from 'react';
import { ChefHat, Calendar, Clock, Phone, User, Users, CheckCircle2 } from 'lucide-react';
import reservationAPI from '../../api/reservationAPI';
import axiosInstance from '../../api/axiosInstance';

const OCCASIONS = [
  { value: 'BIRTHDAY',    label: '🎂 Birthday'    },
  { value: 'ANNIVERSARY', label: '💍 Anniversary' },
  { value: 'OTHER',       label: '✨ Other'        },
];

export default function ReservationPage() {
  const [tables, setTables]     = useState([]);
  const [form, setForm]         = useState({
    customerName: '',
    phone: '',
    tableId: '',
    reservationTime: '',
    partySize: 2,
    occasion: 'BIRTHDAY',
    note: '',
  });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  // Fetch available tables
  useEffect(() => {
    axiosInstance.get('/tables')
      .then(r => setTables(r.data))
      .catch(() => setTables([]));
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!form.customerName.trim()) return setError('Please enter your name.');
    if (!form.phone.trim())        return setError('Please enter your phone number.');
    if (!form.tableId)             return setError('Please select a table.');
    if (!form.reservationTime)     return setError('Please select date and time.');
    if (!form.partySize || form.partySize < 1) return setError('Please enter party size.');

    setLoading(true);
    try {
      await reservationAPI.createPublic({
        ...form,
        tableId: parseInt(form.tableId),
        partySize: parseInt(form.partySize),
        // Convert "2025-12-25T19:30" → "2025-12-25T19:30:00"
        reservationTime: form.reservationTime + ':00',
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Booking failed. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──
  if (success) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Reservation Submitted!</h2>
          <p className="text-gray-400 text-sm mb-1">
            Thank you, <span className="text-white font-semibold">{form.customerName}</span>!
          </p>
          <p className="text-gray-500 text-sm">Our team will confirm your booking shortly.</p>
          <div className="mt-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400">
            📞 We'll contact you on <span className="text-white">{form.phone}</span>
          </div>
          <button
            onClick={() => { setSuccess(false); setForm({ customerName:'',phone:'',tableId:'',reservationTime:'',partySize:2,occasion:'BIRTHDAY',note:'' }); }}
            className="mt-6 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-all active:scale-95"
          >
            Make Another Reservation
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <ChefHat size={28} className="text-white"/>
          </div>
          <h1 className="text-3xl font-bold text-white">Reserve a Table</h1>
          <p className="text-gray-500 text-sm mt-2">Book your special dining experience at AURA</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <User size={12}/> Full Name
            </label>
            <input type="text" value={form.customerName}
              onChange={e => setForm({...form, customerName: e.target.value})}
              placeholder="e.g. Kasun Perera"
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Phone size={12}/> Phone Number
            </label>
            <input type="tel" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="e.g. 077 123 4567"
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Table + Party Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Table</label>
              <select value={form.tableId}
                onChange={e => setForm({...form, tableId: e.target.value})}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="">Select</option>
                {tables.map(t => (
                  <option key={t.tableId} value={t.tableId}>
                    Table {t.tableNumber} (cap: {t.capacity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Users size={12}/> Guests
              </label>
              <input type="number" min="1" max="20" value={form.partySize}
                onChange={e => setForm({...form, partySize: e.target.value})}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Calendar size={12}/> Date & Time
            </label>
            <input type="datetime-local" value={form.reservationTime}
              min={new Date().toISOString().slice(0,16)}
              onChange={e => setForm({...form, reservationTime: e.target.value})}
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Occasion */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block">Occasion</label>
            <div className="grid grid-cols-3 gap-2">
              {OCCASIONS.map(occ => (
                <button key={occ.value} type="button"
                  onClick={() => setForm({...form, occasion: occ.value})}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all active:scale-95 border ${
                    form.occasion === occ.value
                      ? 'bg-orange-500 text-white border-transparent'
                      : 'bg-[#0d0d0d] text-gray-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {occ.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">
              Special Note <span className="text-gray-600">(optional)</span>
            </label>
            <textarea rows={2} value={form.note}
              onChange={e => setForm({...form, note: e.target.value})}
              placeholder="e.g. Window seat preferred, nut allergy..."
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-red-400">⚠️</span>
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Booking...</>
              : <>🍽️ Reserve My Table</>
            }
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">AURA Restaurant · {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}