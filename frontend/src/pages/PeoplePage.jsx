import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../api';
import { fetchCurrentUser } from '../redux/slices/authSlice';
import Avatar from '../components/common/Avatar';

const PersonCard = ({ person, currentUser, onAction }) => {
  const [loading, setLoading] = useState(false);

  const getStatus = () => {
    const id = person._id;
    if (currentUser?.connections?.some(c => (c._id || c) === id)) return 'connected';
    if (currentUser?.sentRequests?.some(c => (c._id || c) === id)) return 'sent';
    if (currentUser?.pendingRequests?.some(c => (c._id || c) === id)) return 'pending';
    return 'none';
  };

  const status = getStatus();

  const handleConnect = async () => {
    setLoading(true);
    try {
      if (status === 'none') await api.sendRequest(person._id);
      else if (status === 'sent') await api.cancelRequest(person._id);
      else if (status === 'pending') await api.acceptRequest(person._id);
      else if (status === 'connected') {
        if (!window.confirm('Remove connection?')) return;
        await api.removeConnection(person._id);
      }
      onAction();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const btnLabel = {
    none: '+ Connect',
    sent: 'Pending',
    pending: 'Accept',
    connected: 'Connected ✓',
  }[status];

  const btnClass = {
    none: 'btn btn-outline btn-sm',
    sent: 'btn btn-ghost btn-sm',
    pending: 'btn btn-primary btn-sm',
    connected: 'btn btn-ghost btn-sm',
  }[status];

  return (
    <div className="card person-card">
      <Link to={`/profile/${person._id}`}>
        <Avatar name={person.name} size="lg" className="mx-auto" />
      </Link>
      <div className="person-name" style={{ marginTop: 10 }}>
        <Link to={`/profile/${person._id}`} style={{ color: 'inherit' }}>{person.name}</Link>
      </div>
      <div className="person-headline">{person.headline || 'Professional'}</div>
      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 10 }}>
        {person.connections?.length || 0} connections
      </div>
      <button className={btnClass} onClick={handleConnect} disabled={loading}>
        {loading ? '...' : btnLabel}
      </button>
    </div>
  );
};

const PeoplePage = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector(state => state.auth);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setPeople(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    await dispatch(fetchCurrentUser());
    loadPeople();
  };

  const filtered = searchQuery
    ? people.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.headline?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : people;

  const connections = filtered.filter(p =>
    currentUser?.connections?.some(c => (c._id || c) === p._id)
  );
  const others = filtered.filter(p =>
    !currentUser?.connections?.some(c => (c._id || c) === p._id)
  );

  return (
    <div className="page-container wide" style={{ maxWidth: 900 }}>
      {searchQuery && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h2>Results for "{searchQuery}"</h2>
          <p style={{ color: 'var(--text-mid)', marginTop: 4 }}>{filtered.length} people found</p>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          {/* My Connections */}
          {!searchQuery && connections.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ marginBottom: 12, fontSize: 18 }}>
                My Connections ({connections.length})
              </h2>
              <div className="people-grid">
                {connections.map(person => (
                  <PersonCard
                    key={person._id}
                    person={person}
                    currentUser={currentUser}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </div>
          )}

          {/* People You May Know */}
          <div>
            <h2 style={{ marginBottom: 12, fontSize: 18 }}>
              {searchQuery ? 'People' : 'People You May Know'}
            </h2>
            {others.length === 0 ? (
              <div className="card empty-state">
                <h3>No people found</h3>
                <p>Try a different search term</p>
              </div>
            ) : (
              <div className="people-grid">
                {others.map(person => (
                  <PersonCard
                    key={person._id}
                    person={person}
                    currentUser={currentUser}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PeoplePage;
