import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './features/auth/AuthProvider';
import { useAuth } from './features/auth/useAuth';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import LoginPage from './features/auth/LoginPage';
import Dashboard from './features/dashboard/Dashboard';
import ToastContainer from './components/ui/ToastContainer';
import UpdateNotification from './components/UpdateNotification';
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
      <UpdateNotification />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
            <AppContent />
          </Router>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
