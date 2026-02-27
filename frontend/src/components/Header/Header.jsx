import './Header.css';

export default function Header({ auth, onLogout, cartCount, onCartToggle }) {
  return (
    <header className="header">
      <nav className="nav">
        <strong>Art & Craft Marketplace</strong>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/#gallery">Gallery</a>
          {auth && <a href="/#admin">Admin</a>}
          {auth ? (
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <span className="auth-prompt">Login/Register</span>
          )}
          {auth && (
            <button className="cart-btn" onClick={onCartToggle}>
              🛒 Cart <span className="cart-badge">{cartCount}</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
