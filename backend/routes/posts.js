const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authenticate } = require('../middleware/auth');

// GET /api/posts - Get feed (all posts, sorted by newest)
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name headline profilePicture')
      .populate('comments.user', 'name profilePicture')
      .populate('repostedBy', 'name profilePicture')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'name headline profilePicture' }
      });

    const total = await Post.countDocuments();
    res.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/user/:userId - Get posts by a specific user
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name headline profilePicture')
      .populate('comments.user', 'name profilePicture')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'name headline profilePicture' }
      });
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts - Create a new post
router.post('/', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = new Post({ author: req.user._id, content: content.trim() });
    await post.save();
    await post.populate('author', 'name headline profilePicture');

    res.status(201).json({ post, message: 'Post created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/posts/:id - Delete a post (owner only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    // Also delete reposts of this post
    await Post.deleteMany({ originalPost: req.params.id });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/like - Like or unlike a post (toggle)
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ liked: !alreadyLiked, likesCount: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/comment - Add a comment to a post
router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = { user: req.user._id, text: text.trim() };
    post.comments.push(comment);
    await post.save();

    // Populate the new comment's user
    await post.populate('comments.user', 'name profilePicture');
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({ comment: newComment, message: 'Comment added' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/posts/:id/comment/:commentId - Delete a comment (owner only)
router.delete('/:id/comment/:commentId', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    post.comments = post.comments.filter(
      c => c._id.toString() !== req.params.commentId
    );
    await post.save();

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/repost - Repost a post
router.post('/:id/repost', authenticate, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ message: 'Post not found' });

    // Prevent reposting your own post
    if (originalPost.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot repost your own post' });
    }

    // Check if already reposted
    const existingRepost = await Post.findOne({
      repostedBy: req.user._id,
      originalPost: req.params.id
    });
    if (existingRepost) {
      return res.status(400).json({ message: 'You already reposted this' });
    }

    const { content } = req.body; // optional comment on repost

    const repost = new Post({
      author: req.user._id,
      content: content || '',
      isRepost: true,
      originalPost: req.params.id,
      repostedBy: req.user._id
    });
    await repost.save();
    await repost.populate('author', 'name headline profilePicture');
    await repost.populate({
      path: 'originalPost',
      populate: { path: 'author', select: 'name headline profilePicture' }
    });

    res.status(201).json({ post: repost, message: 'Reposted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
