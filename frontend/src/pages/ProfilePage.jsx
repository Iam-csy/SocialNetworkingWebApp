import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { api } from '../api';
import { fetchCurrentUser } from '../redux/slices/authSlice';
import { fetchPosts } from '../redux/slices/postsSlice';
import PostCard from '../components/posts/PostCard';
import Avatar from '../components/common/Avatar';

const ProfilePage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector(state => state.auth);
  const { posts } = useSelector(state => state.posts);

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = id === currentUser?._id;

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [userData, postsData] = await Promise.all([
        api.getUser(id),
        api.getUserPosts(id),
      ]);
      setProfileUser(userData.user);
      setUserPosts(postsData.posts);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatus = () => {
    if (!currentUser || !profileUser) return 'none';
    const myId = currentUser._id;
    const theirId = profileUser._id;
    if (currentUser.connections?.some(c => (c._id || c) === theirId)) return 'connected';
    if (currentUser.sentRequests?.some(c => (c._id || c) === theirId)) return 'sent';
    if (currentUser.pendingRequests?.some(c => (c._id || c) === theirId)) return 'pending';
    return 'none';
  };

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      await api.sendRequest(id);
      await dispatch(fetchCurrentUser());
      loadProfile();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await api.acceptRequest(id);
      await dispatch(fetchCurrentUser());
      loadProfile();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await api.rejectRequest(id);
      await dispatch(fetchCurrentUser());
      loadProfile();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await api.cancelRequest(id);
      await dispatch(fetchCurrentUser());
      loadProfile();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove this connection?')) return;
    setActionLoading(true);
    try {
      await api.removeConnection(id);
      await dispatch(fetchCurrentUser());
      loadProfile();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error" style={{ margin: 20 }}>{error}</div>;
  if (!profileUser) return null;

  const connectionStatus = isOwnProfile ? 'own' : getConnectionStatus();
  const connectionsCount = profileUser.connections?.length || 0;

  return (
    <div className="page-container wide" style={{ maxWidth: 768 }}>
      <div className="card" style={{ overflow: 'hidden', marginBottom: 8 }}>
        {/* Banner */}
        <div className="profile-banner" />

        {/* Profile Info */}
        <div className="profile-info">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-img">
              {profileUser.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>

          <div className="profile-name">{profileUser.name}</div>
          {profileUser.headline && <div className="profile-headline">{profileUser.headline}</div>}
          {profileUser.location && (
            <div className="profile-location">📍 {profileUser.location}</div>
          )}
          <div style={{ color: 'var(--primary)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
            {connectionsCount} connection{connectionsCount !== 1 ? 's' : ''}
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            {connectionStatus === 'own' && (
              <a href="/settings" className="btn btn-outline btn-sm">Edit Profile</a>
            )}
            {connectionStatus === 'none' && (
              <button className="btn btn-primary btn-sm" onClick={handleConnect} disabled={actionLoading}>
                + Connect
              </button>
            )}
            {connectionStatus === 'sent' && (
              <button className="btn btn-outline btn-sm" onClick={handleCancel} disabled={actionLoading}>
                Pending · Cancel
              </button>
            )}
            {connectionStatus === 'pending' && (
              <>
                <button className="btn btn-primary btn-sm" onClick={handleAccept} disabled={actionLoading}>
                  Accept
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleReject} disabled={actionLoading}>
                  Ignore
                </button>
              </>
            )}
            {connectionStatus === 'connected' && (
              <button className="btn btn-danger btn-sm" onClick={handleRemove} disabled={actionLoading}>
                Remove Connection
              </button>
            )}
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <div className="profile-bio">{profileUser.bio}</div>
          )}
        </div>
      </div>

      {/* Connections mini list */}
      {profileUser.connections?.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 8 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>
            Connections ({connectionsCount})
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {profileUser.connections.slice(0, 6).map(conn => (
              <a key={conn._id} href={`/profile/${conn._id}`} style={{ textDecoration: 'none', textAlign: 'center' }}>
                <Avatar name={conn.name} size="md" />
                <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-dark)', fontWeight: 500 }}>
                  {conn.name?.split(' ')[0]}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div style={{ marginBottom: 8 }}>
        <div className="card" style={{ padding: '12px 20px', marginBottom: 8 }}>
          <h3 style={{ fontSize: 16 }}>Activity</h3>
        </div>
        {userPosts.length === 0 ? (
          <div className="card empty-state">
            <p>{isOwnProfile ? "You haven't posted yet." : `${profileUser.name} hasn't posted yet.`}</p>
          </div>
        ) : (
          userPosts.map(post => <PostCard key={post._id} post={post} />)
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
