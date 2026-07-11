import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => { if (user?.role === 'admin') api.admin.users().then(setUsers).catch(() => {}); }, [user]);

  const toggleStatus = async (id, current) => {
    const status = current === 'active' ? 'blocked' : 'active';
    await api.admin.updateUserStatus(id, { status });
    setUsers(users.map(u => u.id === id ? { ...u, status } : u));
  };

  if (!user || user.role !== 'admin') return <Navigate to="/login" />;

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>User Management ({users.length})</h2>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr><th style={{ padding: 12, textAlign: 'left' }}>Name</th><th style={{ padding: 12, textAlign: 'left' }}>Email</th><th style={{ padding: 12, textAlign: 'left' }}>Phone</th><th style={{ padding: 12, textAlign: 'left' }}>Role</th><th style={{ padding: 12, textAlign: 'left' }}>Status</th><th style={{ padding: 12, textAlign: 'left' }}>Registered</th><th style={{ padding: 12, textAlign: 'left' }}>Action</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: 12, fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: 12, color: '#6b7280' }}>{u.email}</td>
                <td style={{ padding: 12 }}>{u.phone}</td>
                <td style={{ padding: 12, textTransform: 'capitalize' }}>{u.role}</td>
                <td style={{ padding: 12 }}><span style={{ background: u.status === 'active' ? '#dcfce7' : '#fef2f2', color: u.status === 'active' ? '#15803d' : '#dc2626', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{u.status}</span></td>
                <td style={{ padding: 12, color: '#6b7280', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: 12 }}>
                  {u.role !== 'admin' && (
                    <button onClick={() => toggleStatus(u.id, u.status)} style={{ background: u.status === 'active' ? '#fef2f2' : '#dcfce7', color: u.status === 'active' ? '#dc2626' : '#15803d', border: 'none', padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                      {u.status === 'active' ? 'Block' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
