import React, { useState, useEffect } from 'react';
import { api, storage, theme } from '../utils';
import '../styles/App.css';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [artistName, setArtistName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const loadProducts = async () => {
    if (!adminKey.trim()) {
      setStatus('Enter admin key first to load products.');
      return;
    }
    try {
      const result = await api.loadAdminProducts(adminKey);
      if (result.error) {
        setStatus(result.error || 'Failed to load products');
        return;
      }
      setProducts(Array.isArray(result) ? result : []);
      setStatus('');
    } catch (error) {
      setStatus('Could not load products.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setStatus('Enter admin key first.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);
    formData.append('artistName', artistName);
    formData.append('description', description);
    if (imageFile) formData.append('image', imageFile);
    if (imageUrl) formData.append('imageUrl', imageUrl);

    setStatus('Publishing product...');
    try {
      const result = await api.publishAdminProduct(formData, adminKey);
      if (result.error) {
        setStatus(result.error || 'Failed to publish');
        return;
      }
      setStatus('Product published successfully!');
      setTitle('');
      setPrice('');
      setArtistName('');
      setDescription('');
      setImageFile(null);
      setImageUrl('');
      await loadProducts();
    } catch (error) {
      setStatus('Publish request failed.');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const result = await api.deleteAdminProduct(productId, adminKey);
      if (result.error) {
        setStatus(result.error || 'Failed to delete');
        return;
      }
      setStatus('Product deleted successfully.');
      await loadProducts();
    } catch (error) {
      setStatus('Delete request failed.');
    }
  };

  return (
    <div className="container">
      <h1>Admin Panel</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="password"
          placeholder="Admin Key"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '200px' }}
        />
        <button onClick={loadProducts}>Load Products</button>
      </div>

      {status && <p style={{ color: status.includes('fail') ? 'red' : 'green' }}>{status}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h2>Post New Product</h2>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Artist Name"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '8px', height: '80px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Upload Image File:</label>
          <input
            type="file"
            onChange={(e) => setImageFile(e.target.files?.[0])}
            style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="url"
            placeholder="Or Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>Publish Product</button>
      </form>

      <h2>Posted Products</h2>
      <div style={{ display: 'grid', gap: '10px' }}>
        {products.length > 0 ? (
          products.map((product) => (
            <article key={product.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{product.title}</strong>
                <p style={{ fontSize: '0.9em', color: '#666' }}>{product.description}</p>
                <p style={{ fontSize: '0.85em', color: '#999' }}>Artist: {product.artistName}</p>
              </div>
              <img src={product.image} alt={product.title} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
              <span style={{ fontWeight: 'bold' }}>${Number(product.price).toFixed(2)}</span>
              <button onClick={() => handleDelete(product.id)} style={{ padding: '6px 12px', cursor: 'pointer', background: '#f44', color: '#fff', border: 'none', borderRadius: '4px' }}>Delete</button>
            </article>
          ))
        ) : (
          <p style={{ color: '#999' }}>No products posted yet.</p>
        )}
      </div>
    </div>
  );
}
