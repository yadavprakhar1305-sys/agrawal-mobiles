import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
const STATUS_COLORS = { placed: '#fef3c7', confirmed: '#dbeafe', shipped: '#e0e7ff', delivered: '#dcfce7', cancelled: '#fef2f2', returned: '#fef2f2' };
const STATUS_TEXT = { placed: '#92400e', confirmed: '#1e40af', shipped: '#3730a3', delivered: '#15803d', cancelled: '#dc2626', returned: '#dc2626' };

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');

  const load = () => { api.admin.orders({ status: filter || undefined }).then(setOrders).catch(() => {}); };
  useEffect(() => { if (user?.role === 'admin') load(); }, [user, filter]);

  const updateStatus = async (id, status) => { await api.admin.updateOrder(id, { status }); load(); };

  if (!user || user.role !== 'admin') return <Navigate to="/login" />;

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Order Management</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('')} style={{ background: !filter ? '#1e40af' : '#f3f4f6', color: !filter ? '#fff' : '#1f2937', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ background: filter === s ? '#1e40af' : '#f3f4f6', color: filter === s ? '#fff' : '#1f2937', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {orders.orders?.map(order => (
          <div key={order.id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>{order.order_no}</span>
                <span style={{ color: '#6b7280', fontSize: 13 }}>{order.user_name} ({order.user_email})</span>
                <span style={{ color: '#6b7280', fontSize: 13 }}>{order.user_phone}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>₹{order.total}</span>
                <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontWeight: 600, background: STATUS_COLORS[order.status], color: STATUS_TEXT[order.status], textTransform: 'capitalize' }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>{order.payment_method}</span>
                <span style={{ fontSize: 12, color: order.payment_status === 'paid' ? '#15803d' : '#92400e', textTransform: 'capitalize' }}>{order.payment_status}</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              <span>{order.address}, {order.city} - {order.pincode}</span>
              <span style={{ marginLeft: 16 }}>{new Date(order.created_at).toLocaleString()}</span>
            </div>
            {order.items?.length > 0 && (
              <div style={{ marginTop: 8, borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                {order.items.map((item, i) => (
                  <span key={i} style={{ fontSize: 12, color: '#4b5563', marginRight: 16 }}>📱 {item.name || `Product #${item.product_id || item.id}`} x{item.quantity}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {(!orders.orders || orders.orders.length === 0) && <p style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>No orders found</p>}
      </div>
    </div>
  );
}
