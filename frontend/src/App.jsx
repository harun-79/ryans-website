import { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import AuthSection from './components/AuthSection/AuthSection';
import ProductGrid from './components/ProductGrid/ProductGrid';
import CartSidebar from './components/CartSidebar/CartSidebar';
import { storage } from './utils';
import './styles/App.css';

export default function App() {
  const [auth, setAuth] = useState(() => storage.getAuth());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    updateCartCount();
  }, []);

  const handleLogin = (authData) => {
    storage.saveAuth(authData);
    setAuth(authData);
  };

  const handleLogout = () => {
    storage.logout();
    setAuth(null);
  };

  const handleAddToCart = () => {
    updateCartCount();
  };

  const updateCartCount = () => {
    const cart = storage.getCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  };

  const handleCartUpdate = () => {
    updateCartCount();
  };

  return (
    <div className="app">
      <Header
        auth={auth}
        onLogout={handleLogout}
        cartCount={cartCount}
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
      />

      {!auth ? (
        <div className="container">
          <AuthSection onLogin={handleLogin} />
        </div>
      ) : (
        <div className="container">
          <section className="hero">
            <h1>Discover Unique Handmade Art</h1>
            <p className="muted">Browse and order your favorite craft pieces in minutes.</p>
          </section>
          <h2 className="section-title">Featured Products</h2>
          <ProductGrid onAddToCart={handleAddToCart} />
        </div>
      )}

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        auth={auth}
        onCartUpdate={handleCartUpdate}
      />
    </div>
  );
}
