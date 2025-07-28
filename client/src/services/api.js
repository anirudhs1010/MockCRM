const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'No data available' }));
    throw new Error(error.error || `No data available (${response.status})`);
  }
  return response.json();
};

// Helper function to make requests (no authentication required)
const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    return handleResponse(response);
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No data available - please check your connection');
    }
    throw error;
  }
};

// Deals API
export const dealsAPI = {
  getAll: () => makeRequest('/api/deals'),
  getById: (id) => makeRequest(`/api/deals/${id}`),
  create: (dealData) => makeRequest('/api/deals', {
    method: 'POST',
    body: JSON.stringify(dealData),
  }),
  update: (id, dealData) => makeRequest(`/api/deals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dealData),
  }),
  delete: (id) => makeRequest(`/api/deals/${id}`, {
    method: 'DELETE',
  }),
};

// Customers API
export const customersAPI = {
  getAll: () => makeRequest('/api/customers'),
  getById: (id) => makeRequest(`/api/customers/${id}`),
  create: (customerData) => makeRequest('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  }),
  update: (id, customerData) => makeRequest(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  }),
  delete: (id) => makeRequest(`/api/customers/${id}`, {
    method: 'DELETE',
  }),
};

// Tasks API
export const tasksAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return makeRequest(`/api/tasks?${params}`);
  },
  getById: (id) => makeRequest(`/api/tasks/${id}`),
  create: (taskData) => makeRequest('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }),
  update: (id, taskData) => makeRequest(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  }),
  delete: (id) => makeRequest(`/api/tasks/${id}`, {
    method: 'DELETE',
  }),
};

// Admin API
export const adminAPI = {
  getStages: () => makeRequest('/api/admin/stages'),
  createStage: (stageData) => makeRequest('/api/admin/stages', {
    method: 'POST',
    body: JSON.stringify(stageData),
  }),
  updateStage: (id, stageData) => makeRequest(`/api/admin/stages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(stageData),
  }),
  deleteStage: (id) => makeRequest(`/api/admin/stages/${id}`, {
    method: 'DELETE',
  }),
  getUsers: () => makeRequest('/api/admin/users'),
  createUser: (userData) => makeRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  updateUser: (id, userData) => makeRequest(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  deleteUser: (id) => makeRequest(`/auth/admin/users/${id}`, {
    method: 'DELETE',
  }),
};

// Auth API
export const authAPI = {
  getStatus: () => makeRequest('/auth/status'),
  logout: () => makeRequest('/auth/logout'),
};

// Health check
export const healthCheck = () => makeRequest('/api/health'); 