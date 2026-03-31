import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { likePost, addComment, deleteComment, deletePost, repostPost } from '../../redux/slices/postsSlice';
import Avatar from '../common/Avatar';

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const LikeIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
    <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const RepostIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

const RepostModal = ({ post, onClose, onRepost }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRepost = async () => {
    setLoading(true);
    await onRepost(content);
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Repost</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <textarea
            className="form-control"
            placeholder="Add a thought (optional)..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
          />
          <div className="post-original-content" style={{ marginTop: 12 }}>
            <div className="post-original-author">{post.author?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>{post.content}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleRepost} disabled={loading}>
            {loading ? 'Reposting...' : 'Repost'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const isLiked = post.likes?.some(id =>
    (typeof id === 'object' ? id._id : id) === user?._id
  );
  const isOwner = post.author?._id === user?._id;
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;

  const handleLike = () => {
    dispatch(likePost({ postId: post._id, userId: user._id }));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);
    await dispatch(addComment({ postId: post._id, text: commentText }));
    setCommentText('');
    setCommentLoading(false);
  };

  const handleDeleteComment = (commentId) => {
    dispatch(deleteComment({ postId: post._id, commentId }));
  };

  const handleDelete = () => {
    if (window.confirm('Delete this post?')) {
      dispatch(deletePost(post._id));
    }
  };

  const handleRepost = async (content) => {
    await dispatch(repostPost({ postId: post._id, content }));
  };

  return (
    <div className="card post-card">
      {/* Repost indicator */}
      {post.isRepost && (
        <div className="post-repost-indicator">
          <RepostIcon /> {post.repostedBy?.name || post.author?.name} reposted
        </div>
      )}

      {/* Post Header */}
      <div className="post-header">
        <Link to={`/profile/${post.author?._id}`}>
          <Avatar name={post.author?.name} size="md" />
        </Link>
        <div style={{ flex: 1 }}>
          <div className="post-author-name">
            <Link to={`/profile/${post.author?._id}`}>{post.author?.name}</Link>
          </div>
          {post.author?.headline && (
            <div className="post-author-headline">{post.author.headline}</div>
          )}
          <div className="post-time">{timeAgo(post.createdAt)}</div>
        </div>
        {isOwner && (
          <button className="btn btn-ghost btn-sm" onClick={handleDelete} title="Delete post">
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Post Content */}
      {post.content && <div className="post-content">{post.content}</div>}

      {/* Original Post (if repost) */}
      {post.isRepost && post.originalPost && (
        <div className="post-original-content">
          <div className="post-original-author">
            {post.originalPost.author?.name}
            {post.originalPost.author?.headline && (
              <span style={{ fontWeight: 400, color: 'var(--text-mid)', marginLeft: 6 }}>
                · {post.originalPost.author.headline}
              </span>
            )}
          </div>
          <div style={{ marginTop: 6 }}>{post.originalPost.content}</div>
        </div>
      )}

      {/* Stats */}
      {(likesCount > 0 || commentsCount > 0) && (
        <div className="post-stats">
          <span>{likesCount > 0 ? `${likesCount} like${likesCount > 1 ? 's' : ''}` : ''}</span>
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => setShowComments(!showComments)}
          >
            {commentsCount > 0 ? `${commentsCount} comment${commentsCount > 1 ? 's' : ''}` : ''}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <button
          className={`post-action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <LikeIcon filled={isLiked} />
          {isLiked ? 'Liked' : 'Like'}
        </button>
        <button
          className="post-action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <CommentIcon />
          Comment
        </button>
        {!isOwner && (
          <button
            className="post-action-btn"
            onClick={() => setShowRepostModal(true)}
          >
            <RepostIcon />
            Repost
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="post-comments">
          {post.comments?.map(comment => (
            <div key={comment._id} className="comment">
              <Avatar name={comment.user?.name} size="sm" />
              <div className="comment-bubble" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="comment-author">{comment.user?.name}</span>
                    <span style={{ color: 'var(--text-light)', fontSize: 11, marginLeft: 6 }}>
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  {comment.user?._id === user?._id && (
                    <button
                      className="comment-del"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
                <div className="comment-text">{comment.text}</div>
              </div>
            </div>
          ))}

          {/* Add Comment Form */}
          <form className="comment-form" onSubmit={handleComment}>
            <Avatar name={user?.name} size="sm" />
            <textarea
              className="comment-input"
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              rows={1}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleComment(e);
                }
              }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!commentText.trim() || commentLoading}
            >
              Post
            </button>
          </form>
        </div>
      )}

      {showRepostModal && (
        <RepostModal
          post={post}
          onClose={() => setShowRepostModal(false)}
          onRepost={handleRepost}
        />
      )}
    </div>
  );
};

export default PostCard;
