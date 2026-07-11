import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminSellRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => { if (user?.role === 'admin') api.admin.sellRequests().then(setRequests).catch(() => {}); }, [user]);

  const update = async (id, status) => {
    await api.admin.updateSellRequest(id, { status });
    api.admin.sellRequests().then(setRequests).catch(() => {});
  };

  if (!user || user.role !== 'admin') return <Navigate to="/login" />;

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Sell Requests ({requests.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {requests.map(r => (
          <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{r.brand} {r.model}</span>
                <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 12, textTransform: 'capitalize' }}>{r.condition}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: 4, fontSize: 13, fontWeight: 600 }}>₹{r.asking_price || 'N/A'}</span>
                <span style={{ background: r.status === 'approved' ? '#dcfce7' : r.status === 'rejected' ? '#fef2f2' : '#fef3c7', color: r.status === 'approved' ? '#15803d' : r.status === 'rejected' ? '#dc2626' : '#92400e', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{r.status}</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Submitted by {r.user_name} ({r.email}, {r.phone}) on {new Date(r.created_at).toLocaleDateString()}
            </div>
            {r.description && <p style={{ fontSize: 13, color: '#4b5563', marginTop: 8 }}>{r.description}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {r.status === 'pending' && (
                <>
                  <button onClick={() => update(r.id, 'approved')} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>Approve</button>
                  <button onClick={() => update(r.id, 'rejected')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>Reject</button>
                </>
              )}
            </div>
          </div>
        ))}
        {requests.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>No sell requests yet</p>}
      </div>
    </div>
  );
}
