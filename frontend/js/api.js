/**
 * API Client - Handles all communication with the Flask backend
 * Backend URL: /api
 */

const API_BASE = '/api';

/**
 * Parse response and handle errors
 */
async function handleResponse(response) {
  try {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || `Error: ${response.status}`);
    }
    return data;
  } catch (err) {
    throw new Error(err.message || 'Network error');
  }
}

/**
 * Get authorization header with JWT token
 */
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * API object with all endpoints
 */
export const api = {
  /**
   * Authentication
   */
  register: async (name, email, password) => {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(response);
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  /**
   * Products - Public endpoints
   */
  getProducts: async () => {
    const response = await fetch(`${API_BASE}/products`);
    return handleResponse(response);
  },

  getProduct: async (id) => {
    const response = await fetch(`${API_BASE}/products/${id}`);
    return handleResponse(response);
  },

  /**
   * Orders - Requires authentication
   */
  createOrder: async (items) => {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ items }),
    });
    return handleResponse(response);
  },

  getOrders: async () => {
    const response = await fetch(`${API_BASE}/orders`, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  /**
   * M-Pesa Checkout - Requires authentication
   */
  mpesaCheckout: async (items, phone) => {
    const response = await fetch(`${API_BASE}/mpesa/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ items, phone }),
    });
    return handleResponse(response);
  },

  /**
   * Admin - Products
   */
  getAdminProducts: async (adminKey) => {
    const response = await fetch(`${API_BASE}/admin/products`, {
      headers: { 'x-admin-key': adminKey },
    });
    return handleResponse(response);
  },

  createAdminProduct: async (formData, adminKey) => {
    const response = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: formData,
    });
    return handleResponse(response);
  },

  deleteAdminProduct: async (productId, adminKey) => {
    const response = await fetch(`${API_BASE}/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    });
    return handleResponse(response);
  },

  uploadAdminImage: async (file, adminKey) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API_BASE}/admin/upload-image`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: formData,
    });
    return handleResponse(response);
  },

  /**
   * Admin - Database
   */
  getAdminDatabase: async (adminKey) => {
    const response = await fetch(`${API_BASE}/admin/db/products`, {
      headers: { 'x-admin-key': adminKey },
    });
    return handleResponse(response);
  },

  /**
   * Health check
   */
  health: async () => {
    const response = await fetch(`${API_BASE}/health`);
    return handleResponse(response);
  },

  // Legacy method names for compatibility
  checkout: async (items) => api.createOrder(items),
  loadAdminProducts: async (adminKey) => api.getAdminProducts(adminKey),
  publishAdminProduct: async (formData, adminKey) => api.createAdminProduct(formData, adminKey),
  getDatabase: async (adminKey) => api.getAdminDatabase(adminKey),
};
