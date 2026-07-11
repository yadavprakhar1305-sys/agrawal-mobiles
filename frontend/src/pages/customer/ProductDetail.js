import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');
  const { user } = useAuth();
  const { add } = useCart();

  useEffect(() => {
    api.products.get(slug).then(setProduct).catch(() => {});
  }, [slug]);

  const handleReview = async (e) => {
    e.preventDefault();
    try { await api.reviews.create({ product_id: product.id, rating, comment }); setMsg('Review submitted!'); setComment(''); } catch (err) { setMsg(err.message); }
  };

  if (!product) return <div className="container" style={{ padding: 60, textAlign: 'center' }}>Loading...</div>;

  const images = JSON.parse(product.images || '[]');
  const specs = [
    { label: 'Brand', value: product.brand_name },
    { label: 'OS', value: product.os },
    { label: 'RAM', value: product.ram },
    { label: 'Storage', value: product.storage },
    { label: 'Camera', value: product.camera },
    { label: 'Battery', value: product.battery },
    { label: 'Processor', value: product.processor },
    { label: 'Screen', value: product.screen_size },
    { label: 'Condition', value: product.condition },
    { label: 'Stock', value: product.stock > 0 ? product.stock + ' units' : 'Out of stock' },
  ];

  const discountPct = product.discount_price ? Math.round((1 - product.discount_price / product.price) * 100) : 0;

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div>
          <div style={{ height: 350, background: '#f9fafb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {images[0] ? <img src={images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 24 }} /> : <span style={{ fontSize: 80, opacity: 0.2 }}>[phone]</span>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{product.brand_name} / {product.category_name}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#1e40af' }}>Rs.{product.discount_price || product.price}</span>
            {product.discount_price > 0 && <span style={{ fontSize: 16, color: '#9ca3af', textDecoration: 'line-through' }}>Rs.{product.price}</span>}
            {discountPct > 0 && <span style={{ background: '#22c55e', color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>-{discountPct}%</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <span style={{ background: product.condition === 'new' ? '#dbeafe' : '#fef3c7', color: product.condition === 'new' ? '#1e40af' : '#92400e', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{product.condition}</span>
            <span style={{ background: product.stock > 0 ? '#dcfce7' : '#fef2f2', color: product.stock > 0 ? '#15803d' : '#dc2626', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
            <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{product.os}</span>
          </div>
          <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>{product.description}</p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button onClick={() => { if (user) add(product.id); else alert('Please login first'); }} style={{ flex: 1, padding: 12, background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600 }} disabled={product.stock === 0}>Add to Cart</button>
            <Link to={user ? '/checkout?product=' + product.id : '/login'} style={{ flex: 1, padding: 12, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, textAlign: 'center' }}>Buy Now</Link>
          </div>

          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6b7280' }}>
            <span>Rating: {Number(product.avg_rating || 0).toFixed(1)} ({product.review_count || 0} reviews)</span>
            <span>{product.stock > 5 ? 'Secure Delivery' : 'Hurry, only few left'}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 32 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Specifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {specs.map(s => (
              <div key={s.label} style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Reviews & Ratings</h3>
          {product.reviews && product.reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {product.reviews.slice(0, 5).map(r => (
                <div key={r.id} style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.user_name}</span>
                    <span style={{ fontSize: 13 }}>{Array(r.rating).fill('*').join('')}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: 13, color: '#4b5563' }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>No reviews yet. Be the first to review!</p>
          )}

          {user && (
            <form onSubmit={handleReview}>
              {msg && <div style={{ background: '#dcfce7', color: '#15803d', padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{msg}</div>}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Rating</label>
                <select value={rating} onChange={e => setRating(Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: '100%' }}>
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} stars</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Comment (optional)</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical', minHeight: 60 }} />
              </div>
              <button type="submit" style={{ padding: '10px 24px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600 }}>Submit Review</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
