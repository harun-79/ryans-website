// API utility functions
const API_BASE = '/api';

export async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `Error: ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth endpoints
  register: async (email, password) => {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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

  // Product endpoints
  getProducts: async () => {
    const response = await fetch(`${API_BASE}/products`);
    return handleResponse(response);
  },

  getProduct: async (id) => {
    const response = await fetch(`${API_BASE}/products/${id}`);
    return handleResponse(response);
  },

  // Order endpoints
  checkout: async (items) => {
    const response = await fetch(`${API_BASE}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    return handleResponse(response);
  },

  // M-Pesa endpoints
  mpesaCheckout: async (items, phoneNumber) => {
    const response = await fetch(`${API_BASE}/mpesa/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, phoneNumber }),
    });
    return handleResponse(response);
  },

  // Admin endpoints
  loadAdminProducts: async (adminKey) => {
    const response = await fetch(`${API_BASE}/admin/products`, {
      headers: { 'X-Admin-Key': adminKey },
    });
    return handleResponse(response);
  },

  publishAdminProduct: async (formData, adminKey) => {
    const response = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: { 'X-Admin-Key': adminKey },
      body: formData,
    });
    return handleResponse(response);
  },

  deleteAdminProduct: async (productId, adminKey) => {
    const response = await fetch(`${API_BASE}/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': adminKey },
    });
    return handleResponse(response);
  },

  // Database endpoints
  getDatabase: async (adminKey) => {
    const response = await fetch(`${API_BASE}/admin/db/products`, {
      headers: { 'X-Admin-Key': adminKey },
    });
    return handleResponse(response);
  },
};
