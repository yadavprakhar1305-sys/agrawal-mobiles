import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.products.featured().then(setFeatured).catch(() => {});
    api.categories.list().then(setCategories).catch(() => {});
  }, []);

  const hero = {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    color: '#fff', padding: '60px 16px', textAlign: 'center',
    borderRadius: '0 0 40px 40px', marginBottom: 32,
  };
  const card = { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: '0.2s' };
  const catCard = { background: '#fff', borderRadius: 12, padding: '24px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '2px solid transparent' };

  return (
    <div>
      <div style={hero}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Agrawal Mobiles</h1>
        <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 24 }}>Buy & Sell New and Used Mobile Phones</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/products" style={{ background: '#22c55e', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 600, fontSize: 15 }}>Browse Phones</Link>
          <Link to="/sell" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 600, fontSize: 15 }}>Sell Your Phone</Link>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 24, justifyContent: 'center', fontSize: 14, opacity: 0.85, flexWrap: 'wrap' }}>
          <span>Free Delivery</span>
          <span>Best Prices</span>
          <span>7 Day Return</span>
          <span>Call: 8460431599</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>
          Shop No. 7, Agrawal Market, Near Bus Stand,<br />
          Main Road, City Center, India - 302001<br />
          Email: info@agrawalmobiles.com | Tel: 8460431599
        </div>
      </div>

      <div className="container">
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 40 }}>
          {categories.map(c => (
            <Link to={`/products?category=${c.id}`} key={c.id} style={catCard}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{c.product_count} items</div>
            </Link>
          ))}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Featured Phones</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {featured.map(p => (
            <Link to={`/products/${p.slug}`} key={p.id} style={card}>
              <div style={{ height: 200, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {p.images && JSON.parse(p.images)[0] ? (
                  <img src={JSON.parse(p.images)[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 16 }} />
                ) : (
                  <span style={{ fontSize: 40, opacity: 0.3 }}>📱</span>
                )}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{p.brand_name}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{p.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1e40af' }}>₹{p.discount_price || p.price}</span>
                  {p.discount_price && <span style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through' }}>₹{p.price}</span>}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, textTransform: 'capitalize' }}>{p.condition} &middot; {p.os}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <Link to="/products" style={{ background: '#1e40af', color: '#fff', padding: '12px 36px', borderRadius: 8, fontWeight: 600, fontSize: 15, display: 'inline-block' }}>View All Products</Link>
        </div>
      </div>
    </div>
  );
}
