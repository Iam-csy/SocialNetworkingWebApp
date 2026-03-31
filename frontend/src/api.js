const BASE_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (method, endpoint, body = null) => {
  const options = { method, headers: getHeaders() };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const api = {
  // Auth
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
  logout: () => request('POST', '/auth/logout'),
  getMe: () => request('GET', '/auth/me'),

  // Users
  getUsers: () => request('GET', '/users'),
  getUser: (id) => request('GET', `/users/${id}`),
  updateProfile: (data) => request('PUT', '/users/profile/update', data),
  changePassword: (data) => request('PUT', '/users/password/change', data),
  getUserConnections: (id) => request('GET', `/users/${id}/connections`),
  getUserPosts: (id) => request('GET', `/posts/user/${id}`),

  // Posts
  getPosts: (page = 1) => request('GET', `/posts?page=${page}&limit=10`),
  createPost: (data) => request('POST', '/posts', data),
  deletePost: (id) => request('DELETE', `/posts/${id}`),
  likePost: (id) => request('POST', `/posts/${id}/like`),
  addComment: (id, data) => request('POST', `/posts/${id}/comment`, data),
  deleteComment: (postId, commentId) => request('DELETE', `/posts/${postId}/comment/${commentId}`),
  repost: (id, data) => request('POST', `/posts/${id}/repost`, data),

  // Connections
  sendRequest: (id) => request('POST', `/connections/request/${id}`),
  acceptRequest: (id) => request('POST', `/connections/accept/${id}`),
  rejectRequest: (id) => request('POST', `/connections/reject/${id}`),
  cancelRequest: (id) => request('POST', `/connections/cancel/${id}`),
  removeConnection: (id) => request('DELETE', `/connections/${id}`),
  getPendingRequests: () => request('GET', '/connections/pending/list'),
};
