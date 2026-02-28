// Lightweight cart sidebar: injects a cart button + sidebar, uses store.js
import { store } from './store.js';
import { auth } from './auth.js';

function formatPrice(v) {
  return Number(v).toFixed(2);
}

function createSidebar() {
  const html = `
  <button id="cartBtn" class="cart-btn">🛒 <span id="cartBadge" class="cart-badge">0</span></button>
  <div id="cartOverlay" class="cart-overlay"></div>
  <aside id="cartSidebar" class="cart-sidebar">
    <div class="cart-header">
      <h2>Your Cart</h2>
      <button id="closeCart" class="close-btn">×</button>
    </div>
    <div class="sidebar-items" id="sidebarItems"></div>
    <div class="cart-summary" id="sidebarSummary">
      <h3>Summary</h3>
      <div>Items: <span id="sidebarTotalItems">0</span></div>
      <div>Total: $<span id="sidebarTotalPrice">0.00</span></div>
      <div style="margin-top:12px;">
        <a href="/cart.html" class="btn">Open Cart Page</a>
      </div>
    </div>
  </aside>
  `;

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  const cartBtn = document.getElementById('cartBtn');
  const overlay = document.getElementById('cartOverlay');
  const sidebar = document.getElementById('cartSidebar');
  const closeBtn = document.getElementById('closeCart');

  function open() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }

  function close() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  cartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // require login to view cart
    if (!auth.isLoggedIn()) {
      window.location.href = '/login.html';
      return;
    }
    open();
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  return {
    render: () => {
      const items = store.getCart();
      const itemsDiv = document.getElementById('sidebarItems');
      if (!itemsDiv) return;
      if (items.length === 0) {
        itemsDiv.innerHTML = '<p style="padding:16px">Your cart is empty.</p>';
      } else {
        itemsDiv.innerHTML = items.map(it => `
          <div class="side-cart-item">
            <strong>${it.title}</strong>
            <div class="muted">by ${it.artistName}</div>
            <div class="item-controls">
              <div>$${formatPrice(it.price)}</div>
              <div style="margin-left:auto">x ${it.quantity || 1}</div>
            </div>
          </div>
        `).join('');
      }

      const total = items.reduce((s, it) => s + (Number(it.price) * (it.quantity || 1)), 0);
      const totalItems = items.reduce((s, it) => s + (it.quantity || 1), 0);
      document.getElementById('sidebarTotalItems').textContent = totalItems;
      document.getElementById('sidebarTotalPrice').textContent = formatPrice(total);
      const badge = document.getElementById('cartBadge');
      if (badge) badge.textContent = String(totalItems);
    }
  };
}

// Initialize on DOMContentLoaded so pages can import without immediate DOM issues
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = createSidebar();
  // initial render and subscribe via polling to localStorage changes
  sidebar.render();
  window.addEventListener('storage', () => sidebar.render());
  // also periodically refresh in case same-tab mutations
  setInterval(() => sidebar.render(), 800);
});

export default {};
