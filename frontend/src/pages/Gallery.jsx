import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, storage } from '../utils';
import '../styles/App.css';

export default function Gallery() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.getProducts();
        setProducts(data);
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddToCart = (productId) => {
    storage.addToCart(productId);
    alert('Added to cart!');
  };

  if (loading) return <div className="container"><p>Loading products...</p></div>;
  if (error) return <div className="container"><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div className="container">
      <h1>Gallery</h1>
      <p>Browse all available art pieces</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {products.map((product) => (
          <article key={product.id} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <img src={product.image} alt={product.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 8px 0' }}>{product.title}</h3>
              <p style={{ fontSize: '0.9em', color: '#666', margin: '0 0 8px 0' }}>{product.artistName}</p>
              <p style={{ fontWeight: 'bold', fontSize: '1.2em', margin: '8px 0' }}>${Number(product.price).toFixed(2)}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                  onClick={() => handleAddToCart(product.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add to Cart
                </button>
                <Link
                  to={`/product/${product.id}`}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#2196f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Details
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {products.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>No products available.</p>}
    </div>
  );
}
