// API service module
const api = {
  async getProducts() {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to load products');
    return response.json();
  },

  async getProductById(id) {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) throw new Error('Failed to load product');
    return response.json();
  },

  async register(payload) {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  async login(payload) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  async placeOrder(payload, token) {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  async mpesaCheckout(payload, token) {
    const response = await fetch('/api/mpesa/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  async loadAdminProducts(adminKey) {
    const response = await fetch('/api/admin/products', {
      method: 'GET',
      headers: { 'x-admin-key': adminKey }
    });
    return response.json();
  },

  async deleteAdminProduct(productId, adminKey) {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey }
    });
    return response.json();
  },

  async publishAdminProduct(formData, adminKey) {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: formData
    });
    return response.json();
  },

  async getDatabase(adminKey) {
    const response = await fetch('/api/admin/db', {
      method: 'GET',
      headers: { 'x-admin-key': adminKey }
    });
    return response.json();
  }
};

export default api;
