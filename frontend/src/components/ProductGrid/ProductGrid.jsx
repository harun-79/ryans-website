import { useState, useEffect } from 'react';
import { api, storage } from '../../utils';
import './ProductGrid.css';

export default function ProductGrid({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productId) => {
    storage.addToCart(productId);
    alert('Added to cart!');
    onAddToCart();
  };

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="grid">
      {products.map((product) => (
        <article key={product.id} className="card">
          <img src={product.image} alt={product.title} />
          <div className="card-body">
            <h3>{product.title}</h3>
            <p className="price">${product.price.toFixed(2)}</p>
            <button
              className="add-to-cart-btn"
              onClick={() => handleAddToCart(product.id)}
            >
              Add to Cart
            </button>
            <a className="btn" href={`/?id=${product.id}`}>
              View Details
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
