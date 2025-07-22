const API_BASE_URL = 'http://localhost:5000';

// Helper function to get the access token from Okta
const getAccessToken = async () => {
  try {
    // Import the auth context to get the oktaAuth instance
    const { useAuth } = await import('../contexts/AuthContext');
    const { oktaAuth } = useAuth();
    
    if (!oktaAuth) {
      throw new Error('Okta auth not available');
    }
    
    const tokenManager = oktaAuth.tokenManager;
    const accessToken = await tokenManager.get('accessToken');
    return accessToken ? accessToken.value : null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'No data available' }));
    throw new Error(error.error || `No data available (${response.status})`);
  }
  return response.json();
};

// Helper function to make authenticated requests
const authenticatedRequest = async (endpoint, options = {}, oktaAuth) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get the access token
  let accessToken = null;
  if (oktaAuth) {
    try {
      console.log('API: Getting token from oktaAuth:', !!oktaAuth);
      console.log('API: Token manager available:', !!oktaAuth.tokenManager);
      
      const tokenManager = oktaAuth.tokenManager;
      
      // Try to get the access token first
      const accessTokenObj = await tokenManager.get('accessToken');
      console.log('API: Access token object:', accessTokenObj);
      
      if (accessTokenObj && accessTokenObj.accessToken) {
        accessToken = accessTokenObj.accessToken;
        console.log('API: Using access token for authentication');
      } else {
        // Fallback to ID token
        const idTokenObj = await tokenManager.get('idToken');
        console.log('API: ID token object:', idTokenObj);
        
        if (idTokenObj && idTokenObj.idToken) {
          accessToken = idTokenObj.idToken;
          console.log('API: Using ID token for authentication');
        } else {
          console.log('API: No tokens available in token manager');
        }
      }
    } catch (error) {
      console.error('API: Error getting token:', error);
    }
  } else {
    console.log('API: No oktaAuth provided');
  }
  
  if (!accessToken) {
    throw new Error('No access token available');
  }
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
  };
  
  console.log('API: Making request to:', url);
  console.log('API: With authorization header:', `Bearer ${accessToken.substring(0, 20)}...`);
  
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

// Add at the top of api.js
const isDev = process.env.NODE_ENV === 'development';

// Auth API
export const authAPI = {
  // Get authentication status
  getStatus: () => authenticatedRequest('/auth/status'),
  
  // Logout
  logout: () => authenticatedRequest('/auth/logout'),
};

// Deals API
export const dealsAPI = {
  getAll: (oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/deals`).then(handleResponse);
    }
    return authenticatedRequest('/api/deals', {}, oktaAuth);
  },
  getById: (id, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/deals/${id}`).then(handleResponse);
    }
    return authenticatedRequest(`/api/deals/${id}`, {}, oktaAuth);
  },
  create: (dealData, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      }).then(handleResponse);
    }
    return authenticatedRequest('/api/deals', {
      method: 'POST',
      body: JSON.stringify(dealData),
    }, oktaAuth);
  },
  update: (id, dealData, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      }).then(handleResponse);
    }
    return authenticatedRequest(`/api/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dealData),
    }, oktaAuth);
  },
  delete: (id, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/deals/${id}`, {
        method: 'DELETE',
      }).then(handleResponse);
    }
    return authenticatedRequest(`/api/deals/${id}`, {
      method: 'DELETE',
    }, oktaAuth);
  },
};

// Customers API
export const customersAPI = {
  getAll: (oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/customers`).then(handleResponse);
    }
    return authenticatedRequest('/api/customers', {}, oktaAuth);
  },
  
  // Get single customer
  getById: (id, oktaAuth) => authenticatedRequest(`/api/customers/${id}`, {}, oktaAuth),
  
  // Create new customer
  create: (customerData, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      }).then(handleResponse);
    }
    return authenticatedRequest('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }, oktaAuth);
  },
  
  // Update customer
  update: (id, customerData, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      }).then(handleResponse);
    }
    return authenticatedRequest(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    }, oktaAuth);
  },
  
  // Delete customer
  delete: (id, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/customers/${id}`, {
        method: 'DELETE',
      }).then(handleResponse);
    }
    return authenticatedRequest(`/api/customers/${id}`, {
      method: 'DELETE',
    }, oktaAuth);
  },
};

// Tasks API
export const tasksAPI = {
  getAll: (filters = {}, oktaAuth) => {
    const params = new URLSearchParams(filters);
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/tasks?${params}`).then(handleResponse);
    }
    return authenticatedRequest(`/api/tasks?${params}`, {}, oktaAuth);
  },
  getById: (id, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/tasks/${id}`).then(handleResponse);
    }
    return authenticatedRequest(`/api/tasks/${id}`, {}, oktaAuth);
  },
  create: (taskData, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      }).then(handleResponse);
    }
    return authenticatedRequest('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }, oktaAuth);
  },
  update: (id, taskData, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      }).then(handleResponse);
    }
    return authenticatedRequest(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }, oktaAuth);
  },
  delete: (id, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
      }).then(handleResponse);
    }
    return authenticatedRequest(`/api/tasks/${id}`, {
      method: 'DELETE',
    }, oktaAuth);
  },
};

// Admin API
export const adminAPI = {
  getStages: (oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/admin/stages`).then(handleResponse);
    }
    return authenticatedRequest('/api/admin/stages', {}, oktaAuth);
  },
  createStage: (stageData, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/admin/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageData),
      }).then(handleResponse);
    }
    return authenticatedRequest('/api/admin/stages', {
      method: 'POST',
      body: JSON.stringify(stageData),
    }, oktaAuth);
  },
  updateStage: (id, stageData, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/admin/stages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageData),
      }).then(handleResponse);
    }
    return authenticatedRequest(`/api/admin/stages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stageData),
    }, oktaAuth);
  },
  deleteStage: (id, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/admin/stages/${id}`, {
        method: 'DELETE',
      }).then(handleResponse);
    }
    return authenticatedRequest(`/api/admin/stages/${id}`, {
      method: 'DELETE',
    }, oktaAuth);
  },
  getUsers: (oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/admin/users`).then(handleResponse);
    }
    return authenticatedRequest('/api/admin/users', {}, oktaAuth);
  },
  createUser: (userData, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      }).then(handleResponse);
    }
    return authenticatedRequest('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, oktaAuth);
  },
  updateUser: (id, userData, oktaAuth) => {
    if (isDev) {
      return fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      }).then(handleResponse);
    }
    return authenticatedRequest(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }, oktaAuth);
  },
};

// Health check
export const healthCheck = () => authenticatedRequest('/api/health'); 