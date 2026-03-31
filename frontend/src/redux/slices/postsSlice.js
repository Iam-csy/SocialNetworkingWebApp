import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api';

export const fetchPosts = createAsyncThunk('posts/fetchAll', async (page, { rejectWithValue }) => {
  try {
    return await api.getPosts(page);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createPost = createAsyncThunk('posts/create', async (data, { rejectWithValue }) => {
  try {
    return await api.createPost(data);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deletePost = createAsyncThunk('posts/delete', async (id, { rejectWithValue }) => {
  try {
    await api.deletePost(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const likePost = createAsyncThunk('posts/like', async ({ postId, userId }, { rejectWithValue }) => {
  try {
    const data = await api.likePost(postId);
    return { postId, userId, ...data };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const addComment = createAsyncThunk('posts/addComment', async ({ postId, text }, { rejectWithValue }) => {
  try {
    const data = await api.addComment(postId, { text });
    return { postId, comment: data.comment };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteComment = createAsyncThunk('posts/deleteComment', async ({ postId, commentId }, { rejectWithValue }) => {
  try {
    await api.deleteComment(postId, commentId);
    return { postId, commentId };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const repostPost = createAsyncThunk('posts/repost', async ({ postId, content }, { rejectWithValue }) => {
  try {
    return await api.repost(postId, { content });
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    posts: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: true,
  },
  reducers: {
    clearPosts: (state) => { state.posts = []; state.page = 1; state.hasMore = true; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.page === 1) {
          state.posts = action.payload.posts;
        } else {
          state.posts = [...state.posts, ...action.payload.posts];
        }
        state.page = action.payload.page;
        state.hasMore = action.payload.page < action.payload.pages;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts = [action.payload.post, ...state.posts];
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p._id !== action.payload);
      })
      .addCase(likePost.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) {
          if (action.payload.liked) {
            post.likes = [...post.likes, action.payload.userId];
          } else {
            post.likes = post.likes.filter(id => id !== action.payload.userId && id._id !== action.payload.userId);
          }
        }
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) post.comments.push(action.payload.comment);
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) {
          post.comments = post.comments.filter(c => c._id !== action.payload.commentId);
        }
      })
      .addCase(repostPost.fulfilled, (state, action) => {
        state.posts = [action.payload.post, ...state.posts];
      });
  },
});

export const { clearPosts } = postsSlice.actions;
export default postsSlice.reducer;
