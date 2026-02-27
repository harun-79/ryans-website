import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, storage } from '../utils';
import '../styles/App.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // if already logged in, redirect immediately
  React.useEffect(() => {
    const auth = storage.getAuth();
    if (auth && auth.token) {
      navigate('/');
    }
  }, [navigate]);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      let result;
      if (isRegister) {
        result = await api.register({ name, email, password });
        if (result.error) {
          setMessage(result.error || result.message || 'Registration failed');
          return;
        }
        setMessage('Registration successful! Please log in.');
        setIsRegister(false);
        setName('');
        setPassword('');
        // keep email so user can immediately submit login
      } else {
        result = await api.login({ email, password });
        if (result.error) {
          setMessage(result.error || result.message || 'Login failed');
          return;
        }
        if (result.token) {
          storage.saveAuth(result);
          setMessage('Login successful!');
          setTimeout(() => navigate('/'), 1000);
        }
      }
    } catch (error) {
      setMessage('Request failed. Please try again.');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h1>{isRegister ? 'Register' : 'Login'}</h1>
      {message && (
        <p style={{
          padding: '10px',
          borderRadius: '4px',
          color: message.includes('fail') || message.includes('error') ? '#d32f2f' : '#388e3c',
          background: message.includes('fail') || message.includes('error') ? '#ffebee' : '#e8f5e9'
        }}>
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              required
            />
          </div>
        )}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isRegister ? 'Already have an account? ' : 'No account? '}
        <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', textDecoration: 'underline', fontSize: '1em' }}>
          {isRegister ? 'Login' : 'Register'}
        </button>
      </p>
    </div>
  );
}
