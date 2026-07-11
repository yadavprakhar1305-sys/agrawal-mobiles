import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const { user } = useAuth();

  useEffect(() => { if (user) api.wishlist.get().then(setItems).catch(() => {}); }, [user]);

  const remove = async (productId) => {
    await api.wishlist.remove(productId);
    setItems(items.filter(i => i.id !== productId));
  };

  if (!user) return <div className="container" style={{ padding: 60, textAlign: 'center' }}><p>Please <Link to="/login" style={{ color: '#1e40af', fontWeight: 600 }}>login</Link> to view wishlist.</p></div>;

  if (items.length === 0) return (
    <div className="container" style={{ padding: 80, textAlign: 'center' }}>
      <p style={{ fontSize: 20, color: '#6b7280', marginBottom: 16 }}>Your wishlist is empty</p>
      <Link to="/products" style={{ background: '#1e40af', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 600, display: 'inline-block' }}>Browse Phones</Link>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>My Wishlist ({items.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {items.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Link to={`/products/${p.slug}`}>
              <div style={{ height: 180, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.images && JSON.parse(p.images)[0] ? <img src={JSON.parse(p.images)[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} /> : <span style={{ fontSize: 36, opacity: 0.3 }}>📱</span>}
              </div>
            </Link>
            <div style={{ padding: 14 }}>
              <Link to={`/products/${p.slug}`} style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 4 }}>{p.name}</Link>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e40af', marginBottom: 8 }}>₹{p.discount_price || p.price}</div>
              <button onClick={() => remove(p.id)} style={{ width: '100%', padding: 8, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
