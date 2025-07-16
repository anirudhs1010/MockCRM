const API_BASE_URL = 'http://localhost:5000';
// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'No data available' }));
    throw new Error(error.error || `No data available (${response.status})`);
  }
  return response.json();
};

// Helper function to make authenticated requests
const authenticatedRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    credentials: 'include', // Include cookies for session
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

// Auth API
export const authAPI = {
  // Get authentication status
  getStatus: () => authenticatedRequest('/auth/status'),
  
  // Logout
  logout: () => authenticatedRequest('/auth/logout'),
};

// Deals API
export const dealsAPI = {
  // Get all deals
  getAll: () => authenticatedRequest('/api/deals'),
  
  // Get single deal
  getById: (id) => authenticatedRequest(`/api/deals/${id}`),
  
  // Create new deal
  create: (dealData) => authenticatedRequest('/api/deals', {
    method: 'POST',
    body: JSON.stringify(dealData),
  }),
  
  // Update deal
  update: (id, dealData) => authenticatedRequest(`/api/deals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dealData),
  }),
  
  // Delete deal
  delete: (id) => authenticatedRequest(`/api/deals/${id}`, {
    method: 'DELETE',
  }),
};

// Customers API
export const customersAPI = {
  // Get all customers
  getAll: () => authenticatedRequest('/api/customers'),
  
  // Get single customer
  getById: (id) => authenticatedRequest(`/api/customers/${id}`),
  
  // Create new customer
  create: (customerData) => authenticatedRequest('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  }),
  
  // Update customer
  update: (id, customerData) => authenticatedRequest(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  }),
  
  // Delete customer
  delete: (id) => authenticatedRequest(`/api/customers/${id}`, {
    method: 'DELETE',
  }),
};

// Tasks API
export const tasksAPI = {
  // Get all tasks
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return authenticatedRequest(`/api/tasks?${params}`);
  },
  
  // Get single task
  getById: (id) => authenticatedRequest(`/api/tasks/${id}`),
  
  // Create new task
  create: (taskData) => authenticatedRequest('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }),
  
  // Update task
  update: (id, taskData) => authenticatedRequest(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  }),
  
  // Delete task
  delete: (id) => authenticatedRequest(`/api/tasks/${id}`, {
    method: 'DELETE',
  }),
};

// Admin API
export const adminAPI = {
  // Deal stages
  getStages: () => authenticatedRequest('/api/admin/stages'),
  createStage: (stageData) => authenticatedRequest('/api/admin/stages', {
    method: 'POST',
    body: JSON.stringify(stageData),
  }),
  updateStage: (id, stageData) => authenticatedRequest(`/api/admin/stages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(stageData),
  }),
  deleteStage: (id) => authenticatedRequest(`/api/admin/stages/${id}`, {
    method: 'DELETE',
  }),
  
  // Users
  getUsers: () => authenticatedRequest('/api/admin/users'),
  createUser: (userData) => authenticatedRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  updateUser: (id, userData) => authenticatedRequest(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
};

// Health check
export const healthCheck = () => authenticatedRequest('/api/health'); 