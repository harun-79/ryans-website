import { useState, useEffect } from 'react';
import { api, storage } from '../utils';
import '../styles/CartSidebar.css';

export default function CartSidebar({ isOpen, onClose, auth, onCartUpdate }) {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [phone, setPhone] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

  const loadCart = async () => {
    const cartItems = storage.getCart();
    setCart(cartItems);

    const allProducts = await api.getProducts();
    setProducts(allProducts);

    const cartTotal = cartItems.reduce((sum, item) => {
      const product = allProducts.find((p) => p.id === item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);
    setTotal(cartTotal);
  };

  const handleQtyChange = (productId, delta) => {
    const item = cart.find((i) => i.productId === productId);
    if (item) {
      const newQty = Math.max(1, item.quantity + delta);
      storage.updateQty(productId, newQty);
      loadCart();
      onCartUpdate();
    }
  };

  const handleRemove = (productId) => {
    storage.removeFromCart(productId);
    loadCart();
    onCartUpdate();
  };

  const handleRegularCheckout = async () => {
    if (!cart.length) {
      alert('Your cart is empty');
      return;
    }

    try {
      setLoading(true);
      const result = await api.placeOrder({ items: cart }, auth.token);
      if (result.order) {
        storage.clearCart();
        alert(`Order placed! Order ID: ${result.order.id}`);
        onClose();
        onCartUpdate();
        loadCart();
      } else {
        alert(result.message || 'Failed to place order');
      }
    } catch (err) {
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaCheckout = async () => {
    if (!phone || phone.trim().length < 9) {
      alert('Enter a valid phone number for M-Pesa (e.g. 2547XXXXXXXX).');
      return;
    }

    if (!cart.length) {
      alert('Your cart is empty');
      return;
    }

    try {
      setLoading(true);
      const result = await api.mpesaCheckout({ items: cart, phone }, auth.token);
      if (result.order) {
        storage.clearCart();
        alert(`M-Pesa payment initiated. Order ID: ${result.order.id}`);
        onClose();
        onCartUpdate();
        loadCart();
        setPhone('');
      } else {
        alert(result.message || 'Failed to initiate M-Pesa payment');
      }
    } catch (err) {
      alert('M-Pesa checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={onClose} />}
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sidebar-items">
          {!cart.length ? (
            <p>Your cart is empty.</p>
          ) : (
            cart.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return null;
              const rowTotal = product.price * item.quantity;

              return (
                <div key={item.productId} className="side-cart-item">
                  <strong>{product.title}</strong>
                  <p className="muted">
                    ${product.price.toFixed(2)} × {item.quantity} = ${rowTotal.toFixed(2)}
                  </p>
                  <div className="item-controls">
                    <button
                      className="qty-minus"
                      onClick={() => handleQtyChange(item.productId, -1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="qty-plus"
                      onClick={() => handleQtyChange(item.productId, 1)}
                    >
                      +
                    </button>
                    <button
                      className="remove-item"
                      onClick={() => handleRemove(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-summary">
          <h3>Total: ${total.toFixed(2)}</h3>
          <label htmlFor="mpesa-phone">Phone for M-Pesa (e.g., 2547XXXXXXXX):</label>
          <input
            id="mpesa-phone"
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            className="pay-btn"
            onClick={handleMpesaCheckout}
            disabled={loading || !cart.length}
          >
            {loading ? 'Processing...' : 'Pay with M-Pesa'}
          </button>
          <button
            className="checkout-btn"
            onClick={handleRegularCheckout}
            disabled={loading || !cart.length}
          >
            {loading ? 'Processing...' : 'Regular Checkout'}
          </button>
        </div>
      </div>
    </>
  );
}
