const API_BASE = '/api';

// helper that normalizes fetch responses.  On non-OK responses we
// return an object with an `error` field so callers can handle it
// uniformly.  This mirrors the earlier components' expectations.
async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    return { error: data.message || 'An error occurred' };
  }
  return data;
}

export const api = {
  async getProducts() {
    const response = await fetch(`${API_BASE}/products`);
    // not strictly necessary to normalize but keep consistent
    const data = await handleResponse(response);
    if (data.error) throw new Error(data.error);
    return data;
  },

  async getProductById(id) {
    const response = await fetch(`${API_BASE}/products/${id}`);
    const data = await handleResponse(response);
    if (data.error) throw new Error(data.error);
    return data;
  },

  async register(payload) {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async login(payload) {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async placeOrder(payload, token) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async mpesaCheckout(payload, token) {
    const response = await fetch(`${API_BASE}/mpesa/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
};

// Local storage helpers
const CART_KEY = 'marketplace_cart';
const AUTH_KEY = 'marketplace_auth';

export const storage = {
  getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  },

  setCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  },

  addToCart(productId) {
    const cart = this.getCart();
    const existing = cart.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ productId, quantity: 1 });
    }
    this.setCart(cart);
  },

  updateQty(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find((item) => item.productId === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
    this.setCart(cart);
  },

  removeFromCart(productId) {
    const cart = this.getCart().filter((item) => item.productId !== productId);
    this.setCart(cart);
  },

  clearCart() {
    localStorage.removeItem(CART_KEY);
  },

  getAuth() {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  },

  saveAuth(authData) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
  },
};
