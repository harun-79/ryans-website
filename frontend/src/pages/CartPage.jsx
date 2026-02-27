import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, storage } from '../utils';
import '../styles/App.css';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

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

  const handleCheckout = async () => {
    const auth = storage.getAuth();
    if (!auth?.token) {
      alert('Please log in to checkout.');
      navigate('/login');
      return;
    }
    const items = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }));
    try {
      const result = await api.placeOrder({ items }, auth.token);
      if (result.error) {
        setStatus(`Error: ${result.error}`);
        return;
      }
      setStatus('Order placed successfully!');
      storage.clearCart();
      setCartItems([]);
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
      <h1>Your Cart</h1>
      {status && (
        <p style={{
          padding: '10px',
          borderRadius: '4px',
          color: status.includes('Error') ? '#d32f2f' : '#388e3c',
          background: status.includes('Error') ? '#ffebee' : '#e8f5e9'
        }}>
          {status}
        </p>
      )}
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            {cartItems.map((item) => {
              const product = products[item.productId];
              if (!product) return null;
              return (
                <div key={item.productId} style={{
                  border: '1px solid #ddd',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img src={product.image} alt={product.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div>
                      <h3 style={{ margin: '0 0 5px 0' }}>{product.title}</h3>
                      <p style={{ margin: '0', color: '#666' }}>${Number(product.price).toFixed(2)} each</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQty(item.productId, parseInt(e.target.value))}
                      style={{ width: '50px', padding: '4px' }}
                    />
                    <span style={{ fontWeight: 'bold' }}>${(product.price * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      style={{ padding: '6px 12px', background: '#f44', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ border: '2px solid #333', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 10px 0' }}>Total: ${total.toFixed(2)}</h2>
            <button
              onClick={handleCheckout}
              style={{
                padding: '12px 24px',
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold'
              }}
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
