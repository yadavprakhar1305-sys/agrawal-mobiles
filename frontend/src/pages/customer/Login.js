import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) { setError(err.message); }
  };

  const card = { maxWidth: 400, margin: '60px auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' };
  const input = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, marginTop: 4 };
  const btn = { width: '100%', padding: 12, background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, marginTop: 8 };

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={card}>
        <h2 style={{ textAlign: 'center', marginBottom: 24, fontSize: 24 }}>Login</h2>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>Email</label>
            <input style={input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>Password</label>
            <input style={input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button style={btn} type="submit">Login</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#6b7280' }}>
          Don't have an account? <Link to="/register" style={{ color: '#1e40af', fontWeight: 600 }}>Register</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
          Admin demo: admin@agrawalmobiles.com / admin123
        </p>
      </div>
    </div>
  );
}
