import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid/ProductGrid';
import HeaderNav from '../components/Header/HeaderNav';
import { storage } from '../utils';
import '../styles/App.css';

export default function Home() {
  const [auth, setAuth] = useState(() => storage.getAuth());

  useEffect(() => {
    const handleAuthChange = () => {
      setAuth(storage.getAuth());
    };
    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, []);

  return (
    <div className="app">
      <HeaderNav />
      {!auth ? (
        <div className="container" style={{ maxWidth: '800px', margin: '50px auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3em', marginBottom: '20px' }}>Welcome to Art Marketplace</h1>
          <p style={{ fontSize: '1.2em', color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
            Discover unique handmade art pieces from talented artists around the world.
            Browse our collection, add items to your cart, and place orders with ease.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '400px', margin: '40px auto' }}>
            <Link
              to="/login"
              style={{
                padding: '15px',
                background: '#4caf50',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              Login
            </Link>
            <Link
              to="/login"
              style={{
                padding: '15px',
                background: '#2196f3',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              Register
            </Link>
          </div>
        </div>
      ) : (
        <div className="container">
          <section className="hero" style={{ textAlign: 'center', padding: '40px 0' }}>
            <h1>Welcome, {auth.user?.name}!</h1>
            <p className="muted" style={{ fontSize: '1.1em' }}>Browse and order your favorite craft pieces in minutes.</p>
          </section>
          <h2 className="section-title">Featured Products</h2>
          <ProductGrid />
        </div>
      )}
    </div>
  );
}
