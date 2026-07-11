import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Cart() {
  const { items, count, total, update, remove, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return <div className="container" style={{ padding: 60, textAlign: 'center' }}><p>Please <Link to="/login" style={{ color: '#1e40af', fontWeight: 600 }}>login</Link> to view your cart.</p></div>;

  if (items.length === 0) return (
    <div className="container" style={{ padding: 80, textAlign: 'center' }}>
      <p style={{ fontSize: 20, color: '#6b7280', marginBottom: 16 }}>Your cart is empty</p>
      <Link to="/products" style={{ background: '#1e40af', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 600, display: 'inline-block' }}>Browse Phones</Link>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Shopping Cart ({count} items)</h2>
        <button onClick={clear} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 14, fontWeight: 600 }}>Clear Cart</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 16, background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 100, height: 100, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.images && JSON.parse(item.images)[0] ? <img src={JSON.parse(item.images)[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} /> : <span style={{ fontSize: 28, opacity: 0.3 }}>📱</span>}
              </div>
              <div style={{ flex: 1 }}>
                <Link to={`/products/${item.slug}`} style={{ fontSize: 15, fontWeight: 600, display: 'block', marginBottom: 4 }}>{item.name}</Link>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{item.brand_name} / {item.ram} RAM</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => item.quantity > 1 && update(item.id, item.quantity - 1)} style={{ width: 30, height: 30, background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 16, fontWeight: 600 }}>-</button>
                    <span style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => update(item.id, item.quantity + 1)} style={{ width: 30, height: 30, background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 16, fontWeight: 600 }}>+</button>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1e40af', marginLeft: 'auto' }}>₹{(item.discount_price || item.price) * item.quantity}</span>
                  <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 13 }}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: 'fit-content', position: 'sticky', top: 80 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
            <span>Items ({count})</span>
            <span>₹{total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
            <span>Delivery</span>
            <span style={{ color: '#22c55e' }}>Free</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 18, fontWeight: 700 }}>
            <span>Total</span>
            <span>₹{total}</span>
          </div>
          <button onClick={() => navigate('/checkout')} style={{ width: '100%', padding: 14, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600 }}>Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
}
