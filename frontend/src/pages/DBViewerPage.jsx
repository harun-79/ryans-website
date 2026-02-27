import React, { useState } from 'react';
import { api, theme } from '../utils';
import '../styles/App.css';

export default function DBViewerPage() {
  const [adminKey, setAdminKey] = useState('');
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoad = async () => {
    if (!adminKey.trim()) {
      setError('Please enter admin key');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.getDatabase(adminKey);
      if (result.error) {
        setError(result.error || 'Failed to fetch database');
        setDbData(null);
      } else {
        setDbData(result);
      }
    } catch (err) {
      setError('Request failed');
      setDbData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px', margin: '30px auto' }}>
      <h1 style={{ color: theme.colors.dark }}>Database Viewer (Admin Only)</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="password"
          placeholder="Admin Key"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '200px' }}
        />
        <button onClick={handleLoad} disabled={loading} style={{ padding: '8px 16px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Loading...' : 'Load Database'}
        </button>
      </div>
      {error && <p style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '4px' }}>{error}</p>}
      {dbData && (
        <div>
          <h2>Tables</h2>
          {Object.entries(dbData).map(([tableName, rows]) => (
            <div key={tableName} style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3>{tableName}</h3>
              {Array.isArray(rows) && rows.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.9em'
                  }}>
                    <thead>
                      <tr style={{ background: '#f0f0f0' }}>
                        {Object.keys(rows[0]).map((key) => (
                          <th key={key} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, colIdx) => (
                            <td key={colIdx} style={{ border: '1px solid #ccc', padding: '8px' }}>
                              {String(value).substring(0, 100)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#999' }}>No data in table.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
