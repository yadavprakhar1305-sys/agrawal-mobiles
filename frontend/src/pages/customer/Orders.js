import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = { placed: '#fef3c7', confirmed: '#dbeafe', shipped: '#e0e7ff', delivered: '#dcfce7', cancelled: '#fef2f2', returned: '#fef2f2' };
const STATUS_TEXT_COLORS = { placed: '#92400e', confirmed: '#1e40af', shipped: '#3730a3', delivered: '#15803d', cancelled: '#dc2626', returned: '#dc2626' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) api.orders.list().then(setOrders).catch(() => {});
  }, [user]);

  if (!user) return <div className="container" style={{ padding: 60, textAlign: 'center' }}><p>Please <Link to="/login" style={{ color: '#1e40af', fontWeight: 600 }}>login</Link> to view orders.</p></div>;

  if (orders.length === 0) return (
    <div className="container" style={{ padding: 80, textAlign: 'center' }}>
      <p style={{ fontSize: 20, color: '#6b7280', marginBottom: 16 }}>No orders yet</p>
      <Link to="/products" style={{ background: '#1e40af', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 600, display: 'inline-block' }}>Start Shopping</Link>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>My Orders</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {orders.map(order => (
          <div key={order.id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{order.order_no}</span>
                <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 12 }}>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: STATUS_COLORS[order.status] || '#f3f4f6', color: STATUS_TEXT_COLORS[order.status] || '#6b7280', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{order.status}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1e40af' }}>₹{order.total}</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              <span>{order.address}, {order.city} - {order.pincode}</span>
              <span style={{ marginLeft: 16 }}>Payment: {(order.payment_method || '').toUpperCase()}</span>
              <span style={{ marginLeft: 16, textTransform: 'capitalize' }}>{order.payment_status}</span>
            </div>
            {order.items && order.items.length > 0 && (
              <div style={{ marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#4b5563', padding: '4px 0' }}>📱 {item.name || item.product_id || `Product #${item.product_id}`} x{item.quantity}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
