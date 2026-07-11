import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') api.admin.dashboard().then(setData).catch(() => {});
  }, [user]);

  if (!user || user.role !== 'admin') return <Navigate to="/login" />;
  if (!data) return <div className="container" style={{ padding: 60, textAlign: 'center' }}>Loading...</div>;

  const card = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
  const statBox = { textAlign: 'center', padding: 20, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };

  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh' }}>
      <div style={{ background: '#1e40af', color: '#fff', padding: '24px 16px' }}>
        <div className="container">
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Admin Dashboard</h1>
          <p style={{ opacity: 0.8, fontSize: 14 }}>Welcome back, {user.name}</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={statBox}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1e40af' }}>{data.totalProducts}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Total Products</div>
          </div>
          <div style={statBox}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{data.totalOrders}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Total Orders</div>
          </div>
          <div style={statBox}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6' }}>{data.totalUsers}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Registered Users</div>
          </div>
          <div style={statBox}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>₹{Number(data.totalRevenue).toLocaleString()}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Total Revenue</div>
          </div>
          <div style={statBox}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>{data.pendingSellRequests}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Pending Sell Requests</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { to: '/admin/products', label: 'Manage Products', color: '#1e40af' },
            { to: '/admin/orders', label: 'View Orders', color: '#22c55e' },
            { to: '/admin/users', label: 'Manage Users', color: '#8b5cf6' },
            { to: '/admin/categories', label: 'Categories & Brands', color: '#f59e0b' },
            { to: '/admin/payments', label: 'Payment Settings', color: '#06b6d4' },
            { to: '/admin/sell-requests', label: 'Sell Requests', color: '#ef4444' },
            { to: '/admin/coupons', label: 'Coupons', color: '#ec4899' },
          ].map(l => (
            <Link key={l.to} to={l.to} style={{ background: l.color, color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>{l.label}</Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recent Orders</h3>
            {data.recentOrders.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{o.order_no}</span>
                <span style={{ color: '#6b7280' }}>{o.user_name}</span>
                <span style={{ fontWeight: 600 }}>₹{o.total}</span>
                <span style={{ textTransform: 'capitalize', color: '#6b7280' }}>{o.status}</span>
              </div>
            ))}
          </div>
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Sales by Brand</h3>
            {data.salesByBrand.filter(b => b.count > 0).slice(0, 8).map(b => (
              <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                <span>{b.name}</span>
                <span style={{ color: '#6b7280' }}>{b.count} units</span>
                <span style={{ fontWeight: 600 }}>₹{Number(b.revenue).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
