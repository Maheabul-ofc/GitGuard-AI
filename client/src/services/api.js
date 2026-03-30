import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Dashboard stats
export const getDashboardStats = () => api.get('/pullrequests/stats');

// Pull Requests
export const getAllPullRequests = (page = 1, limit = 20) =>
  api.get(`/pullrequests?page=${page}&limit=${limit}`);

export const getPullRequestById = (id) => api.get(`/pullrequests/${id}`);

// Re-analyze a PR
export const reanalyzePR = (id) => api.post(`/pullrequests/${id}/reanalyze`);

// Reviews
export const getAllReviews = (page = 1, limit = 50) =>
  api.get(`/reviews?page=${page}&limit=${limit}`);

export const getReviewsByPR = (prId) => api.get(`/reviews/pr/${prId}`);

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (settings) => api.put('/settings', settings);

// Logs
export const getLogs = (page = 1, limit = 50) =>
  api.get(`/logs?page=${page}&limit=${limit}`);

// Health
export const getHealth = () => api.get('/health');

export default api;

