import React, { useState } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function SellPhone() {
  const { user } = useAuth();
  const [form, setForm] = useState({ brand: '', model: '', condition: 'good', asking_price: '', description: '' });
  const [msg, setMsg] = useState('');
  const [requests, setRequests] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { setMsg('Please login first'); return; }
    try {
      const data = await api.sell.submit({ ...form, asking_price: form.asking_price ? Number(form.asking_price) : null });
      setMsg(data.message);
      setForm({ brand: '', model: '', condition: 'good', asking_price: '', description: '' });
      api.sell.list().then(setRequests).catch(() => {});
    } catch (err) { setMsg(err.message); }
  };

  React.useEffect(() => { if (user) api.sell.list().then(setRequests).catch(() => {}); }, [user]);

  const input = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, marginTop: 4 };
  const select = { ...input, background: '#fff' };

  return (
    <div className="container" style={{ paddingTop: 24, maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sell Your Phone</h2>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Submit your device details and we'll review it for listing on our marketplace.</p>

      {!user && (
        <div style={{ background: '#fef3c7', padding: 16, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          Please <Link to="/login" style={{ fontWeight: 600, color: '#1e40af' }}>login</Link> or <Link to="/register" style={{ fontWeight: 600, color: '#1e40af' }}>register</Link> to sell your phone.
        </div>
      )}

      {msg && <div style={{ background: msg.includes('error') ? '#fef2f2' : '#dcfce7', color: msg.includes('error') ? '#dc2626' : '#15803d', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{msg}</div>}

      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 32 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Brand</label>
          <input style={input} value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} required placeholder="e.g. Samsung, Apple, Xiaomi" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Model</label>
          <input style={input} value={form.model} onChange={e => setForm({...form, model: e.target.value})} required placeholder="e.g. Galaxy S24, iPhone 15" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Condition</label>
          <select style={select} value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
            <option value="mint">Mint / Like New</option>
            <option value="good">Good (minor wear)</option>
            <option value="fair">Fair (visible scratches)</option>
            <option value="poor">Poor (damaged/not working)</option>
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Asking Price (₹) - Optional</label>
          <input style={input} type="number" value={form.asking_price} onChange={e => setForm({...form, asking_price: e.target.value})} placeholder="Your expected price" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Description</label>
          <textarea style={{ ...input, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the phone's condition, age, accessories included..." />
        </div>
        <button type="submit" style={{ padding: '12px 32px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600 }} disabled={!user}>Submit for Review</button>
      </form>

      {requests.length > 0 && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Your Sell Requests</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><strong>{r.brand} {r.model}</strong> - <span style={{ textTransform: 'capitalize', color: '#6b7280' }}>{r.condition}</span></div>
                  <span style={{ background: r.status === 'approved' ? '#dcfce7' : r.status === 'rejected' ? '#fef2f2' : '#fef3c7', color: r.status === 'approved' ? '#15803d' : r.status === 'rejected' ? '#dc2626' : '#92400e', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{r.status}</span>
                </div>
                {r.asking_price && <div style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>Asking: ₹{r.asking_price}</div>}
                {r.admin_notes && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Admin note: {r.admin_notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
