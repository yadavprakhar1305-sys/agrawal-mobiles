import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [catName, setCatName] = useState('');
  const [brandName, setBrandName] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      api.categories.list().then(setCategories).catch(() => {});
      api.brands.list().then(setBrands).catch(() => {});
    }
  }, [user]);

  const addCategory = async () => {
    if (!catName) return;
    await api.categories.create({ name: catName });
    setCatName('');
    api.categories.list().then(setCategories).catch(() => {});
  };

  const addBrand = async () => {
    if (!brandName) return;
    await api.brands.create({ name: brandName });
    setBrandName('');
    api.brands.list().then(setBrands).catch(() => {});
  };

  const del = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    if (type === 'category') await api.categories.delete(id); else await api.brands.delete(id);
    if (type === 'category') api.categories.list().then(setCategories).catch(() => {}); else api.brands.list().then(setBrands).catch(() => {});
  };

  if (!user || user.role !== 'admin') return <Navigate to="/login" />;

  const input = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, flex: 1 };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Categories & Brands</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Categories ({categories.length})</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input style={input} value={catName} onChange={e => setCatName(e.target.value)} placeholder="New category name" />
            <button onClick={addCategory} style={{ padding: '8px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {categories.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: 6 }}>
                <div><span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span> <span style={{ color: '#6b7280', fontSize: 12 }}>({c.product_count} products)</span></div>
                <button onClick={() => del('category', c.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>Delete</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Brands ({brands.length})</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input style={input} value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="New brand name" />
            <button onClick={addBrand} style={{ padding: '8px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {brands.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: 6 }}>
                <div><span style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</span> <span style={{ color: '#6b7280', fontSize: 12 }}>({b.product_count} products)</span></div>
                <button onClick={() => del('brand', b.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
