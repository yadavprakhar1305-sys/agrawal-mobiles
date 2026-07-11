import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form.name, form.email, form.phone, form.password);
      navigate('/');
    } catch (err) { setError(err.message); }
  };

  const card = { maxWidth: 400, margin: '40px auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' };
  const input = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, marginTop: 4 };
  const btn = { width: '100%', padding: 12, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600 };

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={card}>
        <h2 style={{ textAlign: 'center', marginBottom: 24, fontSize: 24 }}>Create Account</h2>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {['name','email','phone','password'].map(f => (
            <div style={{ marginBottom: 14 }} key={f}>
              <label style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{f === 'phone' ? 'Phone Number' : f === 'name' ? 'Full Name' : f}</label>
              <input style={input} type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'text'} value={form[f]} onChange={e => setForm({...form, [f]: e.target.value})} required />
            </div>
          ))}
          <button style={btn} type="submit">Register</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#6b7280' }}>
          Already have an account? <Link to="/login" style={{ color: '#1e40af', fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
