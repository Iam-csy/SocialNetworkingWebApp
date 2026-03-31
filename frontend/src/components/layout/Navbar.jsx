import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/slices/authSlice';
import Avatar from '../common/Avatar';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M23 9l-11-7L1 9v13h8v-7h6v7h8z"/>
  </svg>
);
const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);
const NotifIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
  </svg>
);
const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/people?search=${encodeURIComponent(search.trim())}`);
  };

  const pendingCount = user?.pendingRequests?.length || 0;
  const isActive = (path) => location.pathname === path ? 'nav-item active' : 'nav-item';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">LinkedOut</Link>

      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search people..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </form>

      <div className="navbar-nav">
        <Link to="/" className={isActive('/')}>
          <HomeIcon />
          Home
        </Link>

        <Link to="/people" className={isActive('/people')}>
          <PeopleIcon />
          Network
        </Link>

        <Link to="/notifications" className={`${isActive('/notifications')} nav-badge`}>
          <NotifIcon />
          {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
          Notifs
        </Link>

        <div style={{ position: 'relative' }}>
          <button
            className="nav-item"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <ProfileIcon />
            Me
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute', right: 0, top: '100%',
              background: 'white', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              minWidth: 220, zIndex: 300
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                <Avatar name={user?.name} size="md" />
                <div>
                  <div style={{ fontWeight: 700 }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{user?.headline || 'Add a headline'}</div>
                </div>
              </div>
              <div style={{ padding: 8 }}>
                <Link
                  to={`/profile/${user?._id}`}
                  style={{ display: 'block', padding: '8px 12px', borderRadius: 4, color: 'var(--text-dark)', fontWeight: 500 }}
                  onClick={() => setShowDropdown(false)}
                >
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  style={{ display: 'block', padding: '8px 12px', borderRadius: 4, color: 'var(--text-dark)', fontWeight: 500 }}
                  onClick={() => setShowDropdown(false)}
                >
                  Settings
                </Link>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                <button
                  onClick={handleLogout}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 4, background: 'none', border: 'none', color: 'var(--text-dark)', fontWeight: 500, cursor: 'pointer' }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDropdown && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 299 }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
