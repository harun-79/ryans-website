const CART_KEY = 'marketplace_cart';
const AUTH_KEY = 'marketplace_auth';

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function setCart(cartItems) {
  localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
}

function addToCart(productId) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  setCart(cart);
}

function updateQty(productId, quantity) {
  const cart = getCart().map((item) =>
    item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
  );
  setCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.productId !== productId);
  setCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
}

function saveAuth(authData) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

function getAuth() {
  return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
}
