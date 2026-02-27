import React from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../../utils';

export default function HeaderNav() {
  const auth = storage.getAuth();

  const handleLogout = () => {
    storage.logout();
    window.location.reload();
  };

  return (
    <header style={{
      background: '#333',
      color: '#fff',
      padding: '15px 20px',
      borderBottom: '2px solid #444'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#fff', textDecoration: 'none' }}>
          Art Marketplace
        </Link>

        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>
          {auth && <Link to="/gallery" style={{ color: '#fff', textDecoration: 'none' }}>Gallery</Link>}
          {auth && <Link to="/cart" style={{ color: '#fff', textDecoration: 'none' }}>Cart</Link>}
          {auth?.user?.role === 'admin' && (
            <>
              <Link to="/admin" style={{ color: '#fff', textDecoration: 'none' }}>Admin</Link>
              <Link to="/db-viewer" style={{ color: '#fff', textDecoration: 'none' }}>DB Viewer</Link>
            </>
          )}
        </nav>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {auth ? (
            <>
              <span>{auth.user?.name || 'User'}</span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  background: '#f44',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" style={{
              padding: '8px 16px',
              background: '#4caf50',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px'
            }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
