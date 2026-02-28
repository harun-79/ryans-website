// Local storage utilities for cart
export const store = {
  getCart: () => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  },

  addToCart: (product) => {
    const cart = store.getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
  },

  removeFromCart: (productId) => {
    const cart = store.getCart().filter((item) => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
  },

  clearCart: () => {
    localStorage.removeItem('cart');
  },

  updateQuantity: (productId, quantity) => {
    const cart = store.getCart();
    const item = cart.find((item) => item.id === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  },
};
