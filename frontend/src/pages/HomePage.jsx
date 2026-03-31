import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../redux/slices/postsSlice';
import PostCard from '../components/posts/PostCard';
import CreatePost from '../components/posts/CreatePost';
import Avatar from '../components/common/Avatar';

const ProfileSidebar = ({ user }) => (
  <div className="card profile-card">
    <div className="profile-card-banner" />
    <div className="profile-card-body">
      <div className="profile-card-avatar">
        <Avatar name={user?.name} size="lg" className="mx-auto" />
      </div>
      <div className="profile-card-name">
        <Link to={`/profile/${user?._id}`} style={{ color: 'inherit' }}>
          {user?.name}
        </Link>
      </div>
      <div className="profile-card-headline">{user?.headline || 'Add a headline'}</div>
      <hr className="profile-card-divider" />
      <div className="profile-card-stat">
        <span>Connections</span>
        <span>{user?.connections?.length || 0}</span>
      </div>
      <div className="profile-card-stat">
        <span>Pending</span>
        <span>{user?.pendingRequests?.length || 0}</span>
      </div>
      <hr className="profile-card-divider" />
      <Link to={`/profile/${user?._id}`} className="btn btn-outline btn-block btn-sm">
        View Profile
      </Link>
    </div>
  </div>
);

const NewsSidebar = () => (
  <div className="card" style={{ padding: 16 }}>
    <h3 style={{ fontSize: 16, marginBottom: 12 }}>LinkedOut News</h3>
    {[
      'Top voices in Tech 2025',
      'Remote work trends this year',
      'How to grow your network',
      'Skills employers want most',
      'Building your personal brand',
    ].map((item, i) => (
      <div key={i} style={{ padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{item}</div>
        <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>
          {Math.floor(Math.random() * 5000) + 500} readers
        </div>
      </div>
    ))}
  </div>
);

const HomePage = () => {
  const dispatch = useDispatch();
  const { posts, loading, hasMore, page } = useSelector(state => state.posts);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchPosts(1));
  }, [dispatch]);

  const loadMore = () => {
    if (!loading && hasMore) dispatch(fetchPosts(page + 1));
  };

  return (
    <div className="page-container">
      {/* Left Sidebar */}
      <aside className="sidebar-left">
        <ProfileSidebar user={user} />
      </aside>

      {/* Main Feed */}
      <main className="feed-main">
        <CreatePost />

        {posts.length === 0 && !loading && (
          <div className="card empty-state">
            <h3>No posts yet</h3>
            <p>Be the first to share something with your network!</p>
          </div>
        )}

        {posts.map(post => (
          <PostCard key={post._id} post={post} />
        ))}

        {loading && <div className="loading-center"><div className="spinner" /></div>}

        {!loading && hasMore && (
          <div className="text-center" style={{ padding: '20px 0' }}>
            <button className="btn btn-outline" onClick={loadMore}>Load more</button>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center text-mid" style={{ padding: 20, fontSize: 13 }}>
            You're all caught up!
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="sidebar-right">
        <NewsSidebar />
      </aside>
    </div>
  );
};

export default HomePage;
