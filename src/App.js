import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './features/auth/AuthProvider';
import { useAuth } from './features/auth/useAuth';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import LoginPage from './features/auth/LoginPage';
import Dashboard from './features/dashboard/Dashboard';
import ToastContainer from './components/ui/ToastContainer';
import './App.css';
import './styles/notifications.css';

// Test media URL resolution
setTimeout(() => {
  if (window.electronAPI && window.electronAPI.getMediaUrl) {
    console.log('🧪 Testing media URL resolution...');
    const testUrls = [
      'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1048408267398810&ext=1751121593&hash=ARlgLAXVsF3gyqZokIacAsM-H548oqnxIvb0rGcZjHi2aA',
      'media/audio/64_1751112035835.ogg'
    ];
    
    testUrls.forEach(async (url) => {
      try {
        const resolved = await window.electronAPI.getMediaUrl(url);
        console.log(`✅ ${url} → ${resolved}`);
      } catch (error) {
        console.error(`❌ Failed to resolve ${url}:`, error);
      }
    });
  }
}, 3000);

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Apply theme to document
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    // Debug auth state
    console.log('🔐 Auth state:', { user, isAuthenticated, loading });
  }, [user, isAuthenticated, loading]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  console.log('🎨 Rendering AppContent with loading:', loading, 'isAuthenticated:', isAuthenticated);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Bob Explorer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground">
      <Routes>
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? 
            <LoginPage /> : 
            <Navigate to="/dashboard" replace />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
            <Dashboard user={user} theme={theme} toggleTheme={toggleTheme} /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
      <ToastContainer />
    </div>
  );
}

function App() {
  console.log('🎯 Main App component rendering...');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Router>
              <AppContent />
            </Router>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f8f9fa',
          fontFamily: 'Arial, sans-serif',
          padding: '20px'
        }}>
          <h1 style={{ color: '#dc3545' }}>🚨 Application Error</h1>
          <p>Something went wrong. Please restart the application.</p>
          <details style={{ marginTop: '20px', width: '100%', maxWidth: '600px' }}>
            <summary>Error Details</summary>
            <pre style={{ 
              background: '#f1f3f4', 
              padding: '10px', 
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;
