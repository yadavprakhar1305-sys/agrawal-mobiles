import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const LABELS = { cod: 'Cash on Delivery', upi: 'UPI (GPay / PhonePe / Paytm)', card: 'Debit / Credit Card', netbanking: 'Net Banking' };

export default function AdminPayments() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState([]);

  useEffect(() => { if (user?.role === 'admin') api.paymentConfig.list().then(setConfigs).catch(() => {}); }, [user]);

  const toggle = async (method, enabled) => {
    await api.paymentConfig.update(method, { enabled: enabled ? 1 : 0 });
    api.paymentConfig.list().then(setConfigs).catch(() => {});
  };

  if (!user || user.role !== 'admin') return <Navigate to="/login" />;

  return (
    <div className="container" style={{ paddingTop: 24, maxWidth: 600 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Payment Configuration</h2>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>Enable or disable payment methods available at checkout.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {configs.map(c => (
          <div key={c.method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{LABELS[c.method] || c.method}</span>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, textTransform: 'uppercase' }}>{c.method}</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!c.enabled} onChange={e => toggle(c.method, e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', inset: 0, background: c.enabled ? '#22c55e' : '#d1d5db', borderRadius: 26, transition: '0.3s' }}>
                <span style={{ position: 'absolute', width: 22, height: 22, borderRadius: '50%', background: '#fff', top: 2, left: c.enabled ? 24 : 2, transition: '0.3s' }} />
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
