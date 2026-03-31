import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPost } from '../../redux/slices/postsSlice';
import Avatar from '../common/Avatar';

const CreatePost = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    const result = await dispatch(createPost({ content }));
    if (result.error) {
      setError('Failed to create post. Try again.');
    } else {
      setContent('');
      setShowModal(false);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="card create-post-card">
        <Avatar name={user?.name} size="md" />
        <button
          className="create-post-btn"
          onClick={() => setShowModal(true)}
        >
          Start a post, {user?.name?.split(' ')[0]}
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={user?.name} size="md" />
                <div>
                  <div style={{ fontWeight: 700 }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Post to anyone</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <textarea
                  className="form-control"
                  placeholder="What do you want to talk about?"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={6}
                  autoFocus
                  maxLength={3000}
                />
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                  {content.length}/3000
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!content.trim() || loading}
                >
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreatePost;
