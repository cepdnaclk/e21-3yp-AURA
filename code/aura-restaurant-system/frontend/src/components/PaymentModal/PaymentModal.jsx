import { useState } from 'react';
import { X, CreditCard, Banknote, CheckCircle2, Loader2 } from 'lucide-react';
import paymentAPI from '../../api/paymentAPI';
import waiterAPI from '../../api/waiterAPI';

export default function PaymentModal({ tableId, tableNumber, onClose, theme, onCashWaiterCalled, orders }) {
  const D = theme === 'dark';

  const unpaidOrders = orders ?? [];
  const totalAmount  = unpaidOrders.reduce((s, o) => s + (o.total || 0), 0);

  const [loading, setLoading]           = useState(false);
  const [success]                       = useState(false);
  const [cashRequested, setCashRequested] = useState(false);
  const [error, setError]               = useState('');

  // ── Colour helpers (matches RobotUI tc pattern) ──
  const tc = {
    modal:   D ? 'bg-[#1a1a1a] border-white/10'              : 'bg-white border-gray-200',
    tt:      D ? 'text-white'                                 : 'text-gray-900',
    st:      D ? 'text-gray-400'                              : 'text-gray-500',
    divider: D ? 'border-white/10'                           : 'border-gray-200',
    row:     D ? 'bg-white/5 border-white/5'                 : 'bg-gray-50 border-gray-200',
    btn2:    D ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700',
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6">
        <div className={`w-full max-w-sm rounded-3xl border shadow-2xl p-8 flex flex-col items-center gap-4 ${tc.modal}`}>
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-green-400" />
          </div>
          <h2 className={`text-xl font-bold ${tc.tt}`}>Payment Successful!</h2>
          <p className={`text-sm text-center ${tc.st}`}>
            Rs. {totalAmount.toFixed(2)} payment completed for {tableNumber}.
          </p>
          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold transition-all active:scale-95">
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Cash waiter-requested screen ─────────────────────────────────────────
  if (cashRequested) {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6">
        <div className={`w-full max-w-sm rounded-3xl border shadow-2xl p-8 flex flex-col items-center gap-4 ${tc.modal}`}>
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center text-3xl">🔔</div>
          <h2 className={`text-xl font-bold ${tc.tt}`}>Waiter Is On The Way!</h2>
          <p className={`text-sm text-center ${tc.st}`}>
            A staff member will come to {tableNumber} to collect your cash payment shortly.
          </p>
          <button
            onClick={onCashWaiterCalled ?? onClose}
            className="w-full h-11 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-white font-bold transition-all active:scale-95">
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── No unpaid orders ──────────────────────────────────────────────────────
  if (unpaidOrders.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6">
        <div className={`w-full max-w-sm rounded-3xl border shadow-2xl p-8 flex flex-col items-center gap-4 ${tc.modal}`}>
          <CheckCircle2 size={40} className="text-green-400" />
          <h2 className={`text-lg font-bold ${tc.tt}`}>No Pending Bill</h2>
          <p className={`text-sm ${tc.st}`}>All orders for {tableNumber} are paid.</p>
          <button onClick={onClose} className={`w-full h-10 rounded-xl text-sm font-semibold ${tc.btn2}`}>
            Close
          </button>
        </div>
      </div>
    );
  }

  // ── Cash payment handler — notifies waiter to collect cash ───────────────
  const handleCash = async () => {
    setLoading(true);
    setError('');
    try {
      await waiterAPI.callWaiter(
        tableId,
        tableNumber,
        `💵 Cash payment requested — please collect at ${tableNumber}`
      );
      setCashRequested(true);
    } catch (err) {
      setError('Failed to call waiter. Please speak to a staff member directly.');
    } finally {
      setLoading(false);
    }
  };

  // ── PayHere Card/QR handler ───────────────────────────────────────────────
  // Uses a hidden form POST to avoid CORS issues with the PayHere JS SDK.
  // The browser posts directly to PayHere, then PayHere redirects back.
  const handlePayHere = async () => {
    setLoading(true);
    setError('');
    try {
      const orderIds = unpaidOrders.map(o => o.id);
      const data = await paymentAPI.initiatePayHereForTable(tableId, orderIds);

      const checkoutUrl = data.sandbox
        ? 'https://sandbox.payhere.lk/pay/checkout'
        : 'https://www.payhere.lk/pay/checkout';

      const fields = {
        merchant_id:  data.merchantId,
        return_url:   window.location.origin,
        cancel_url:   window.location.origin,
        notify_url:   `${import.meta.env.VITE_API_URL}/payments/callback`,
        order_id:     String(data.orderId),
        items:        `AURA Restaurant — ${tableNumber}`,
        currency:     data.currency,
        amount:       data.amount,
        hash:         data.hash,
        first_name:   'Customer',
        last_name:    '',
        email:        'customer@aura.lk',
        phone:        '0771234567',
        address:      'AURA Restaurant',
        city:         'Colombo',
        country:      'Sri Lanka',
      };

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = checkoutUrl;

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (err) {
      setError(err.response?.data?.message || 'Could not initiate payment.');
      setLoading(false);
    }
  };

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] ${tc.modal}`}>

        {/* Header */}
        <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${tc.divider}`}>
          <div className="flex items-center gap-3">
            <CreditCard size={20} className="text-green-400" />
            <h2 className={`text-lg font-bold ${tc.tt}`}>Pay Bill</h2>
            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${D ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {tableNumber}
            </span>
          </div>
          <button onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${tc.btn2}`}>
            <X size={16} />
          </button>
        </div>

        {/* Order summary */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {unpaidOrders.map(order => (
            <div key={order.id} className={`flex items-center justify-between p-3 rounded-2xl border ${tc.row}`}>
              <div>
                <p className={`text-sm font-semibold ${tc.tt}`}>Order #{order.id}</p>
                <p className={`text-xs ${tc.st}`}>{order.items?.length || 0} item(s)</p>
              </div>
              <p className="text-orange-500 font-bold text-sm">Rs. {order.total?.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Total + buttons */}
        <div className={`flex-shrink-0 px-6 py-4 border-t ${tc.divider} space-y-3`}>

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${tc.st}`}>Total Amount</span>
            <span className="text-2xl font-bold text-green-400">
              Rs. {totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 text-xs">⚠️ {error}</span>
            </div>
          )}

          {/* PayHere button */}
          <button
            onClick={handlePayHere}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : <CreditCard size={18} />
            }
            Pay with Card / QR (PayHere)
          </button>

          {/* Cash button */}
          <button
            onClick={handleCash}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-green-600/30">
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : <Banknote size={18} />
            }
            Pay with Cash
          </button>

          {/* Cancel */}
          <button onClick={onClose} disabled={loading}
            className={`w-full h-10 rounded-xl text-sm font-semibold transition-all active:scale-95 ${tc.btn2}`}>
            Cancel
          </button>

        </div>
      </div>
    </div>
  );
}