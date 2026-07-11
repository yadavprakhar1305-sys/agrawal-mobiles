import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);

  const filters = {
    brand: searchParams.get('brand') || '',
    category: searchParams.get('category') || '',
    os: searchParams.get('os') || '',
    condition: searchParams.get('condition') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '',
  };

  useEffect(() => {
    api.brands.list().then(setBrands).catch(() => {});
    api.categories.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const params = { ...filters, page, limit: 12 };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    api.products.list(params).then(data => {
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    }).catch(() => {});
  }, [searchParams, page]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    setSearchParams(params);
    setPage(1);
  };

  const card = { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: '0.2s' };
  const input = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 };
  const select = { ...input, background: '#fff' };

  return (
    <div className="container" style={{ paddingTop: 24, display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: 'fit-content', position: 'sticky', top: 80 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Filters</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Search</label>
          <input style={input} placeholder="Search phones..." value={filters.search} onChange={e => updateFilter('search', e.target.value)} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Brand</label>
          <select style={select} value={filters.brand} onChange={e => updateFilter('brand', e.target.value)}>
            <option value="">All Brands</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Category</label>
          <select style={select} value={filters.category} onChange={e => updateFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>OS</label>
          <select style={select} value={filters.os} onChange={e => updateFilter('os', e.target.value)}>
            <option value="">All OS</option>
            <option value="Android">Android</option>
            <option value="iOS">iOS</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Condition</label>
          <select style={select} value={filters.condition} onChange={e => updateFilter('condition', e.target.value)}>
            <option value="">All Conditions</option>
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="refurbished">Refurbished</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Price Range</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={input} type="number" placeholder="Min" value={filters.min_price} onChange={e => updateFilter('min_price', e.target.value)} />
            <input style={input} type="number" placeholder="Max" value={filters.max_price} onChange={e => updateFilter('max_price', e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Sort By</label>
          <select style={select} value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}>
            <option value="">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="name">Name</option>
          </select>
        </div>

        <button style={{ width: '100%', padding: 10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600 }} onClick={() => { setSearchParams({}); setPage(1); }}>
          Clear Filters
        </button>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Phones ({total})</h2>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            <p style={{ fontSize: 18 }}>No phones found</p>
            <p style={{ fontSize: 14 }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {products.map(p => (
              <Link to={`/products/${p.slug}`} key={p.id} style={card}>
                <div style={{ height: 180, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p.images && JSON.parse(p.images)[0] ? (
                    <img src={JSON.parse(p.images)[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
                  ) : (
                    <span style={{ fontSize: 36, opacity: 0.3 }}>📱</span>
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{p.brand_name}</div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{p.name}</h3>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{p.ram} RAM / {p.storage}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#1e40af' }}>₹{p.discount_price || p.price}</span>
                    {p.discount_price && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>₹{p.price}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ padding: '8px 16px', background: p === page ? '#1e40af' : '#fff', color: p === page ? '#fff' : '#1f2937', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
