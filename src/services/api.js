const API_BASE_URL = 'http://localhost:5000/api';

// get token from localStorage
const getToken = () => localStorage.getItem('workasana_token');

// api request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// auth api
export const authAPI = {
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name, email, password) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  getMe: () => apiRequest('/auth/me'),
};

// users api
export const usersAPI = {
  getAll: () => apiRequest('/users'),
};

// teams api
export const teamsAPI = {
  getAll: () => apiRequest('/teams'),
  create: (name, description) =>
    apiRequest('/teams', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
};

// projects api
export const projectsAPI = {
  getAll: () => apiRequest('/projects'),
  create: (name, description) =>
    apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
};

// tasks api
export const tasksAPI = {
  getAll: (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    const queryString = queryParams.toString();
    return apiRequest(`/tasks${queryString ? `?${queryString}` : ''}`);
  },

  create: (taskData) =>
    apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),

  update: (id, updates) =>
    apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  delete: (id) =>
    apiRequest(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};

// tags api
export const tagsAPI = {
  getAll: () => apiRequest('/tags'),
  create: (name) =>
    apiRequest('/tags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
};

// reports api
export const reportsAPI = {
  getLastWeek: () => apiRequest('/report/last-week'),
  getPending: () => apiRequest('/report/pending'),
  getClosedTasks: () => apiRequest('/report/closed-tasks'),
};

// health check
export const healthAPI = {
  check: () => apiRequest('/health'),
};