import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, storage, theme } from '../utils';
import '../styles/App.css';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [checkoutMethod, setCheckoutMethod] = useState('regular');

  useEffect(() => {
    const load = async () => {
      try {
        const cart = storage.getCart();
        setCartItems(cart);
        const allProducts = await api.getProducts();
        const productMap = {};
        allProducts.forEach((p) => { productMap[p.id] = p; });
        setProducts(productMap);
      } catch (err) {
        setStatus('Failed to load cart');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdateQty = (productId, qty) => {
    if (qty < 1) {
      storage.removeFromCart(productId);
    } else {
      storage.updateQty(productId, qty);
    }
    setCartItems(storage.getCart());
  };

  const handleRemove = (productId) => {
    storage.removeFromCart(productId);
    setCartItems(storage.getCart());
  };

  const handleCheckout = async (useMpesa = false) => {
    const auth = storage.getAuth();
    if (!auth?.token) {
      alert('Please log in to checkout.');
      navigate('/login');
      return;
    }

    if (useMpesa && !phoneNumber.trim()) {
      setStatus('Please enter your phone number for M-Pesa payment');
      return;
    }

    const items = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }));
    try {
      let result;
      if (useMpesa) {
        result = await api.mpesaCheckout({ items, phone: phoneNumber }, auth.token);
      } else {
        result = await api.placeOrder({ items }, auth.token);
      }
      if (result.error) {
        setStatus(`Error: ${result.error}`);
        return;
      }
      if (useMpesa) {
        setStatus(`✓ M-Pesa payment initiated! Check your phone ${phoneNumber}`);
      } else {
        setStatus('✓ Order placed successfully!');
      }
      storage.clearCart();
      setCartItems([]);
      setPhoneNumber('');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setStatus('Checkout failed. Please try again.');
    }
  };

  if (loading) return <div className="container"><p>Loading cart...</p></div>;

  const total = cartItems.reduce((sum, item) => {
    const product = products[item.productId];
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '30px auto' }}>
      <h1 style={{ color: theme.colors.dark }}>Shopping Cart</h1>
      {status && (
        <p style={{
          padding: '12px 15px',
          borderRadius: '4px',
          color: status.includes('Error') ? '#c62828' : '#2e7d32',
          background: status.includes('Error') ? '#ffcdd2' : '#c8e6c9',
          border: `1px solid ${status.includes('Error') ? '#ef5350' : '#81c784'}`,
          marginBottom: '15px'
        }}>
          {status}
        </p>
      )}
      {cartItems.length === 0 ? (
        <p style={{ color: theme.colors.textMuted, fontSize: '1.1em' }}>Your cart is empty.</p>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            {cartItems.map((item) => {
              const product = products[item.productId];
              if (!product) return null;
              return (
                <div key={item.productId} style={{
                  border: `1px solid ${theme.colors.border}`,
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fafafa'
                }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img src={product.image} alt={product.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: theme.colors.dark }}>{product.title}</h3>
                      <p style={{ margin: '0', color: theme.colors.textMuted }}>${Number(product.price).toFixed(2)} each</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQty(item.productId, parseInt(e.target.value))}
                      style={{ width: '50px', padding: '4px', borderRadius: '4px', border: `1px solid ${theme.colors.border}` }}
                    />
                    <span style={{ fontWeight: 'bold', color: theme.colors.dark, minWidth: '70px' }}>${(product.price * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      style={{ padding: '6px 12px', background: theme.colors.danger, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{
            border: `3px solid ${theme.colors.primary}`,
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: theme.colors.light
          }}>
            <h2 style={{ margin: '0 0 15px 0', color: theme.colors.dark }}>Order Total: ${total.toFixed(2)}</h2>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.colors.dark }}>
                Choose Payment Method:
              </label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="checkout"
                    value="regular"
                    checked={checkoutMethod === 'regular'}
                    onChange={(e) => setCheckoutMethod(e.target.value)}
                  />
                  <span style={{ color: theme.colors.dark, fontWeight: '500' }}>Regular Purchase</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="checkout"
                    value="mpesa"
                    checked={checkoutMethod === 'mpesa'}
                    onChange={(e) => setCheckoutMethod(e.target.value)}
                  />
                  <span style={{ color: theme.colors.dark, fontWeight: '500' }}>M-Pesa Payment</span>
                </label>
              </div>
            </div>

            {checkoutMethod === 'mpesa' && (
              <div style={{
                marginBottom: '15px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '4px',
                border: `1px solid ${theme.colors.warning}`
              }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.colors.dark }}>
                  Phone Number (with country code, e.g., +254712345678):
                </label>
                <input
                  type="tel"
                  placeholder="+254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: `1px solid ${theme.colors.border}`,
                    boxSizing: 'border-box',
                    fontSize: '1em'
                  }}
                />
              </div>
            )}

            <button
              onClick={() => handleCheckout(checkoutMethod === 'mpesa')}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: checkoutMethod === 'mpesa' ? theme.colors.warning : theme.colors.success,
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {checkoutMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Complete Order'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
