function setAuthState() {
  const auth = getAuth();
  const authStatus = document.getElementById('auth-status');
  const authActions = document.getElementById('auth-actions');

  if (!authStatus || !authActions) return;

  if (auth?.user) {
    authStatus.textContent = `Welcome back, ${auth.user.name}!`;
    authActions.innerHTML = '<button id="logout-btn" class="logout-btn">Logout</button>';
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      logout();
      window.location.reload();
    });

    // Show products, hide auth forms
    const authSection = document.getElementById('auth-section');
    const productsSection = document.getElementById('products-section');
    if (authSection) authSection.style.display = 'none';
    if (productsSection) productsSection.style.display = 'block';
  } else {
    authStatus.textContent = 'Please log in or register to get started';
  }
}

async function submitRegister(event) {
  event.preventDefault();
  const payload = {
    name: document.getElementById('reg-name').value,
    email: document.getElementById('reg-email').value,
    password: document.getElementById('reg-password').value
  };

  const result = await api.register(payload);
  if (result.message) {
    alert(result.message);
  }
}

async function submitLogin(event) {
  event.preventDefault();
  const payload = {
    email: document.getElementById('login-email').value,
    password: document.getElementById('login-password').value
  };

  const result = await api.login(payload);
  if (result.token) {
    saveAuth(result);
    setAuthState();
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
  } else {
    alert(result.message || 'Login failed');
  }
}

document.getElementById('register-form')?.addEventListener('submit', submitRegister);
document.getElementById('login-form')?.addEventListener('submit', submitLogin);

async function renderProductGrid(containerId, limit = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const products = await api.getProducts();
    const visibleProducts = limit ? products.slice(0, limit) : products;

    container.innerHTML = visibleProducts
      .map(
        (product) => `
        <article class="card">
          <img src="${product.image}" alt="${product.title}" />
          <div class="card-body">
            <h3>${product.title}</h3>
            <p class="price">$${product.price.toFixed(2)}</p>
            <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
            <a class="btn" href="/product.html?id=${product.id}">View Details</a>
          </div>
        </article>
      `
      )
      .join('');

    // Attach click handlers to "Add to Cart" buttons
    container.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.getAttribute('data-product-id');
        addToCart(productId);
        updateCartDisplay();
        alert('Added to cart!');
      });
    });
  } catch (error) {
    container.innerHTML = '<p>Could not load products.</p>';
  }
}

function updateCartDisplay() {
  const cart = getCart();
  const badge = document.getElementById('cart-count');
  if (badge) {
    badge.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  }
  renderCartSidebar();
}

async function renderCartSidebar() {
  const cart = getCart();
  const itemsContainer = document.getElementById('sidebar-items');
  const totalEl = document.getElementById('sidebar-total');

  if (!cart.length) {
    itemsContainer.innerHTML = '<p>Your cart is empty.</p>';
    totalEl.textContent = '0.00';
    return;
  }

  const products = await api.getProducts();
  let total = 0;

  itemsContainer.innerHTML = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return '';
      const rowTotal = product.price * item.quantity;
      total += rowTotal;

      return `
        <div class="side-cart-item">
          <strong>${product.title}</strong>
          <p class="muted">$${product.price.toFixed(2)} × ${item.quantity} = $${rowTotal.toFixed(2)}</p>
          <div class="item-controls">
            <button class="qty-minus" data-id="${item.productId}">−</button>
            <span>${item.quantity}</span>
            <button class="qty-plus" data-id="${item.productId}">+</button>
            <button class="remove-item" data-id="${item.productId}">Remove</button>
          </div>
        </div>
      `;
    })
    .join('');

  totalEl.textContent = total.toFixed(2);

  // Attach event listeners
  itemsContainer.querySelectorAll('.qty-minus').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const newQty = Math.max(1, (getCart().find((i) => i.productId === id)?.quantity || 1) - 1);
      updateQty(id, newQty);
      updateCartDisplay();
    });
  });

  itemsContainer.querySelectorAll('.qty-plus').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const newQty = (getCart().find((i) => i.productId === id)?.quantity || 1) + 1;
      updateQty(id, newQty);
      updateCartDisplay();
    });
  });

  itemsContainer.querySelectorAll('.remove-item').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      removeFromCart(id);
      updateCartDisplay();
    });
  });
}

function initCartSidebar() {
  const cartToggle = document.getElementById('cart-toggle');
  const cartClose = document.getElementById('cart-close');
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  const mpesaBtn = document.getElementById('mpesa-checkout-btn');
  const regularBtn = document.getElementById('regular-checkout-btn');

  if (!cartToggle) return;

  cartToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    updateCartDisplay();
  });

  cartClose.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  regularBtn.addEventListener('click', handleRegularCheckout);
  mpesaBtn.addEventListener('click', handleMpesaCheckoutSidebar);

  // Initialize cart badge
  updateCartDisplay();
}

async function handleRegularCheckout() {
  const auth = getAuth();
  if (!auth?.token) {
    alert('Please login before checkout.');
    window.location.href = '/login.html';
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    alert('Your cart is empty.');
    return;
  }

  const result = await api.placeOrder({ items: cart }, auth.token);

  if (result.order) {
    clearCart();
    alert(`Order placed! Order ID: ${result.order.id}`);
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
    updateCartDisplay();
  } else {
    alert(result.message || 'Failed to place order');
  }
}

async function handleMpesaCheckoutSidebar() {
  const auth = getAuth();
  if (!auth?.token) {
    alert('Please login before checkout.');
    window.location.href = '/login.html';
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    alert('Your cart is empty.');
    return;
  }

  const phone = (document.getElementById('mpesa-phone-sidebar') || {}).value || '';
  if (!phone || phone.trim().length < 9) {
    alert('Enter a valid phone number for M-Pesa (e.g. 2547XXXXXXXX).');
    return;
  }

  const payload = { items: cart, phone };
  const result = await api.mpesaCheckout(payload, auth.token);

  if (result.order) {
    clearCart();
    alert(`M-Pesa payment initiated. Order ID: ${result.order.id}. Payment will be processed shortly.`);
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
    updateCartDisplay();
  } else {
    alert(result.message || 'Failed to initiate M-Pesa payment');
  }
}

// Initialize on page load
setAuthState();
const auth = getAuth();
if (auth?.user) {
  renderProductGrid('featured-grid', 3);
  initCartSidebar();
}
