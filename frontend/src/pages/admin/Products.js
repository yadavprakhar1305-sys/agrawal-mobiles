import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', brand_id: '', category_id: '', os: 'Android', ram: '', storage: '', camera: '', battery: '', processor: '', screen_size: '', condition: 'new', price: '', discount_price: '', stock: '', description: '', images: '', featured: false });

  useEffect(() => {
    if (user?.role === 'admin') {
      api.admin.products().then(setProducts).catch(() => {});
      api.brands.list().then(setBrands).catch(() => {});
      api.categories.list().then(setCategories).catch(() => {});
    }
  }, [user]);

  const resetForm = () => { setForm({ name: '', brand_id: '', category_id: '', os: 'Android', ram: '', storage: '', camera: '', battery: '', processor: '', screen_size: '', condition: 'new', price: '', discount_price: '', stock: '', description: '', images: '', featured: false }); setEditId(null); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), discount_price: form.discount_price ? Number(form.discount_price) : null, stock: Number(form.stock), brand_id: Number(form.brand_id), category_id: Number(form.category_id), images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [] };
    try {
      if (editId) { await api.products.update(editId, payload); } else { await api.products.create(payload); }
      resetForm();
      api.admin.products().then(setProducts).catch(() => {});
    } catch (err) { alert(err.message); }
  };

  const edit = (p) => { setForm({ name: p.name, brand_id: p.brand_id?.toString() || '', category_id: p.category_id?.toString() || '', os: p.os, ram: p.ram || '', storage: p.storage || '', camera: p.camera || '', battery: p.battery || '', processor: p.processor || '', screen_size: p.screen_size || '', condition: p.condition, price: p.price.toString(), discount_price: p.discount_price?.toString() || '', stock: p.stock.toString(), description: p.description || '', images: JSON.parse(p.images || '[]').join(', '), featured: p.featured }); setEditId(p.id); setShowForm(true); };

  const deleteProduct = async (id) => { if (window.confirm('Delete this product?')) { await api.products.delete(id); api.admin.products().then(setProducts).catch(() => {}); } };

  if (!user || user.role !== 'admin') return <Navigate to="/login" />;

  const input = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, marginTop: 2 };
  const select = { ...input, background: '#fff' };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Product Management ({products.length})</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ background: showForm ? '#6b7280' : '#1e40af', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>{showForm ? 'Cancel' : 'Add Product'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Name *</label><input style={input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Brand</label><select style={select} value={form.brand_id} onChange={e => setForm({...form, brand_id: e.target.value})} required><option value="">Select</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Category</label><select style={select} value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} required><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>OS</label><select style={select} value={form.os} onChange={e => setForm({...form, os: e.target.value})}><option>Android</option><option>iOS</option></select></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>RAM</label><input style={input} value={form.ram} onChange={e => setForm({...form, ram: e.target.value})} placeholder="8GB" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Storage</label><input style={input} value={form.storage} onChange={e => setForm({...form, storage: e.target.value})} placeholder="256GB" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Camera</label><input style={input} value={form.camera} onChange={e => setForm({...form, camera: e.target.value})} placeholder="50MP + 12MP" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Battery</label><input style={input} value={form.battery} onChange={e => setForm({...form, battery: e.target.value})} placeholder="5000mAh" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Processor</label><input style={input} value={form.processor} onChange={e => setForm({...form, processor: e.target.value})} placeholder="Snapdragon 8 Gen 3" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Screen Size</label><input style={input} value={form.screen_size} onChange={e => setForm({...form, screen_size: e.target.value})} placeholder="6.7 inches" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Condition</label><select style={select} value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}><option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option></select></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Price *</label><input style={input} type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Discount Price</label><input style={input} type="number" value={form.discount_price} onChange={e => setForm({...form, discount_price: e.target.value})} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 500 }}>Stock *</label><input style={input} type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required /></div>
          <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 12, fontWeight: 500 }}>Image URLs (comma separated)</label><input style={input} value={form.images} onChange={e => setForm({...form, images: e.target.value})} placeholder="https://..." /></div>
          <div style={{ gridColumn: 'span 3' }}><label style={{ fontSize: 12, fontWeight: 500 }}>Description</label><textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} id="featured" />
            <label htmlFor="featured" style={{ fontSize: 13 }}>Featured Product</label>
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <button type="submit" style={{ padding: '10px 28px', background: editId ? '#f59e0b' : '#22c55e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600 }}>{editId ? 'Update Product' : 'Create Product'}</button>
          </div>
        </form>
      )}

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr><th style={{ padding: 12, textAlign: 'left' }}>Name</th><th style={{ padding: 12, textAlign: 'left' }}>Brand</th><th style={{ padding: 12, textAlign: 'left' }}>Price</th><th style={{ padding: 12, textAlign: 'left' }}>Stock</th><th style={{ padding: 12, textAlign: 'left' }}>Status</th><th style={{ padding: 12, textAlign: 'left' }}>Actions</th></tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: 12 }}>{p.name}</td>
                <td style={{ padding: 12, color: '#6b7280' }}>{p.brand_name}</td>
                <td style={{ padding: 12, fontWeight: 600 }}>₹{p.discount_price || p.price}</td>
                <td style={{ padding: 12 }}>{p.stock}</td>
                <td style={{ padding: 12 }}><span style={{ background: p.status === 'active' ? '#dcfce7' : '#fef2f2', color: p.status === 'active' ? '#15803d' : '#dc2626', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{p.status}</span></td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => edit(p)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, marginRight: 6 }}>Edit</button>
                  <button onClick={() => deleteProduct(p.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
