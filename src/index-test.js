import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Simple test component instead of the full App
function TestApp() {
  console.log('🎯 TestApp component rendering...');
  
  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🎉 React App is Working!</h1>
      <p>This is a test to verify React is loading in production.</p>
      <p>Version: 1.1.8</p>
      <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
        <p>✅ React is loaded</p>
        <p>✅ Styles are working</p>
        <p>✅ JavaScript is executing</p>
        <p>ElectronAPI: {window.electronAPI ? '✅ Available' : '❌ Not Available'}</p>
      </div>
      <button 
        onClick={() => alert('Button works!')}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
}

console.log('🔍 Starting React app...');
console.log('Document ready state:', document.readyState);
console.log('Root element exists:', !!document.getElementById('root'));

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);

console.log('✅ React render initiated');
