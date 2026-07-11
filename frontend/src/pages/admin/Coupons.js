import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminCoupons() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '100', expires_at: '' });

  useEffect(() => { if (user?.role === 'admin') api.coupons.list().then(setCoupons).catch(() => {}); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.coupons.create({ ...form, discount_value: Number(form.discount_value), min_order: Number(form.min_order) || 0, max_uses: Number(form.max_uses) });
    setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '100', expires_at: '' });
    api.coupons.list().then(setCoupons).catch(() => {});
  };

  const del = async (id) => { if (window.confirm('Delete coupon?')) { await api.coupons.delete(id); api.coupons.list().then(setCoupons).catch(() => {}); } };

  if (!user || user.role !== 'admin') return <Navigate to="/login" />;

  const input = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: '100%' };
  const select = { ...input, background: '#fff' };

  return (
    <div className="container" style={{ paddingTop: 24, maxWidth: 700 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Coupons & Offers</h2>

      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={{ fontSize: 12, fontWeight: 500 }}>Coupon Code</label><input style={input} value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required /></div>
        <div><label style={{ fontSize: 12, fontWeight: 500 }}>Discount Type</label><select style={select} value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (₹)</option></select></div>
        <div><label style={{ fontSize: 12, fontWeight: 500 }}>Discount Value</label><input style={input} type="number" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} required /></div>
        <div><label style={{ fontSize: 12, fontWeight: 500 }}>Min Order (₹)</label><input style={input} type="number" value={form.min_order} onChange={e => setForm({...form, min_order: e.target.value})} /></div>
        <div><label style={{ fontSize: 12, fontWeight: 500 }}>Max Uses</label><input style={input} type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} /></div>
        <div><label style={{ fontSize: 12, fontWeight: 500 }}>Expires At</label><input style={input} type="date" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} /></div>
        <div style={{ gridColumn: 'span 2' }}><button type="submit" style={{ padding: '10px 28px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600 }}>Create Coupon</button></div>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {coupons.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'monospace' }}>{c.code}</span>
              <span style={{ marginLeft: 12, fontSize: 13, color: '#6b7280' }}>
                {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                {c.min_order > 0 && ` (min ₹${c.min_order})`}
              </span>
              <span style={{ marginLeft: 12, fontSize: 12, color: '#6b7280' }}>Used: {c.used_count}/{c.max_uses}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: c.status === 'active' ? '#dcfce7' : '#fef2f2', color: c.status === 'active' ? '#15803d' : '#dc2626', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{c.status}</span>
              <button onClick={() => del(c.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
