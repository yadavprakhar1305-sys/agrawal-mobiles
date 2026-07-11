import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const PAYMENT_LABELS = { cod: 'Cash on Delivery', upi: 'UPI (GPay/PhonePe/Paytm)', card: 'Debit/Credit Card', netbanking: 'Net Banking' };

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const directProductId = searchParams.get('product');

  const [address, setAddress] = useState({ line: '', city: '', pincode: '', phone: user?.phone || '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [payments, setPayments] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.paymentConfig.list().then(p => setPayments(p.filter(pm => pm.enabled))).catch(() => {});
  }, []);

  const grandTotal = Math.max(0, total - discount);

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const data = await api.coupons.validate({ code: couponCode, order_total: total });
      setDiscount(data.discount);
      setCouponMsg(`Coupon applied! You saved ₹${data.discount}`);
    } catch (err) { setCouponMsg(err.message); setDiscount(0); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.line || !address.city || !address.pincode || !address.phone) { setError('Please fill all address fields'); return; }
    try {
      const itemsToOrder = directProductId ? [{ product_id: Number(directProductId), id: Number(directProductId), quantity: 1, price: total }] : items.map(i => ({ product_id: i.product_id || i.id, id: i.id, quantity: i.quantity, price: i.discount_price || i.price }));
      const order = await api.orders.create({
        items: itemsToOrder,
        total: grandTotal,
        address: address.line,
        city: address.city,
        pincode: address.pincode,
        phone: address.phone,
        payment_method: paymentMethod,
      });
      if (!directProductId) await clear();
      setSuccess(`Order placed successfully! Order #${order.order_no}`);
      setTimeout(() => navigate('/orders'), 2000);
    } catch (err) { setError(err.message); }
  };

  if (!user) { navigate('/login'); return null; }

  const input = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, marginTop: 4 };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Checkout</h2>
      {success ? (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: 20, borderRadius: 12, fontSize: 16, fontWeight: 600, textAlign: 'center' }}>{success}</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Delivery Address</h3>
            {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Address Line</label>
              <input style={input} value={address.line} onChange={e => setAddress({...address, line: e.target.value})} required placeholder="Street, area, landmark" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500 }}>City</label>
                <input style={input} value={address.city} onChange={e => setAddress({...address, city: e.target.value})} required />
              </div>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Pincode</label>
                <input style={input} value={address.pincode} onChange={e => setAddress({...address, pincode: e.target.value})} required />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Phone Number</label>
              <input style={input} value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} required />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 16 }}>Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {payments.map(p => (
                <label key={p.method} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: paymentMethod === p.method ? '2px solid #1e40af' : '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' }}>
                  <input type="radio" name="payment" value={p.method} checked={paymentMethod === p.method} onChange={e => setPaymentMethod(e.target.value)} />
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{PAYMENT_LABELS[p.method] || p.method}</span>
                </label>
              ))}
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>Items</h3>
            {directProductId ? (
              <p style={{ color: '#6b7280', fontSize: 14 }}>Direct purchase (1 item)</p>
            ) : (
              items.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span>{i.name} x{i.quantity}</span>
                  <span style={{ fontWeight: 600 }}>₹{(i.discount_price || i.price) * i.quantity}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: 'fit-content', position: 'sticky', top: 80 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Coupon Code</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter code" />
                <button type="button" onClick={applyCoupon} style={{ padding: '8px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Apply</button>
              </div>
              {couponMsg && <div style={{ fontSize: 12, color: discount > 0 ? '#15803d' : '#dc2626', marginTop: 4 }}>{couponMsg}</div>}
            </div>

            <div style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{total}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span style={{ color: '#22c55e' }}>Free</span></div>
              {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}><span>Discount</span><span>-₹{discount}</span></div>}
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              <span>Total</span>
              <span>₹{grandTotal}</span>
            </div>
            <button type="submit" style={{ width: '100%', padding: 14, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600 }}>
              Place Order
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
