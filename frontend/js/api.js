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
  }
};
