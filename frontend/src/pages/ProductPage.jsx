import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, storage } from '../utils';
import '../styles/App.css';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await api.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    storage.addToCart(id);
    alert('Added to cart!');
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p style={{ color: 'red' }}>{error}</p></div>;
  if (!product) return <div className="container"><p>Product not found</p></div>;

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '30px auto' }}>
      <h1>{product.title}</h1>
      <img src={product.image} alt={product.title} style={{ width: '100%', borderRadius: '8px', marginBottom: '20px' }} />
      <p><strong>Artist:</strong> {product.artistName}</p>
      <p><strong>Price:</strong> ${Number(product.price).toFixed(2)}</p>
      <p><strong>Description:</strong></p>
      <p>{product.description}</p>
      <button onClick={handleAddToCart} style={{ padding: '10px 20px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em' }}>
        Add to Cart
      </button>
    </div>
  );
}
