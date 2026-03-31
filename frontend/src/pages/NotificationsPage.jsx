import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../api';
import { fetchCurrentUser } from '../redux/slices/authSlice';
import Avatar from '../components/common/Avatar';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector(state => state.auth);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingRequests();
      setPendingRequests(data.pendingRequests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      if (action === 'accept') await api.acceptRequest(userId);
      else await api.rejectRequest(userId);
      await dispatch(fetchCurrentUser());
      loadRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const sentRequests = currentUser?.sentRequests || [];

  return (
    <div className="page-container wide" style={{ maxWidth: 700 }}>
      {/* Incoming requests */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          Connection Requests
          {pendingRequests.length > 0 && (
            <span style={{
              marginLeft: 8, background: 'var(--primary)', color: 'white',
              borderRadius: 12, padding: '2px 8px', fontSize: 13
            }}>
              {pendingRequests.length}
            </span>
          )}
        </h2>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : pendingRequests.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔔</div>
            <h3>No pending requests</h3>
            <p>When someone sends you a connection request, it will appear here.</p>
          </div>
        ) : (
          pendingRequests.map(person => (
            <div key={person._id} className="request-item">
              <Link to={`/profile/${person._id}`}>
                <Avatar name={person.name} size="md" />
              </Link>
              <div className="request-info">
                <div className="request-name">
                  <Link to={`/profile/${person._id}`} style={{ color: 'inherit' }}>
                    {person.name}
                  </Link>
                </div>
                {person.headline && (
                  <div className="request-headline">{person.headline}</div>
                )}
              </div>
              <div className="request-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAction(person._id, 'accept')}
                  disabled={actionLoading[person._id]}
                >
                  Accept
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleAction(person._id, 'reject')}
                  disabled={actionLoading[person._id]}
                >
                  Ignore
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sent requests */}
      {sentRequests.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>
            Sent Requests ({sentRequests.length})
          </h2>
          {sentRequests.map(person => {
            const p = typeof person === 'object' ? person : { _id: person, name: 'User' };
            return (
              <div key={p._id} className="request-item">
                <Avatar name={p.name} size="md" />
                <div className="request-info">
                  <div className="request-name">{p.name}</div>
                  {p.headline && <div className="request-headline">{p.headline}</div>}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    await api.cancelRequest(p._id);
                    await dispatch(fetchCurrentUser());
                  }}
                >
                  Withdraw
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
