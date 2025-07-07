import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AIToggleButton = ({ customerPhone, className = '', onStatusChange }) => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load AI status when component mounts or customer changes
  useEffect(() => {
    if (customerPhone) {
      loadAIStatus();
    }
  }, [customerPhone]);

  const loadAIStatus = async () => {
    try {
      setError(null);
      const result = await window.electronAPI.getAIStatus(customerPhone);
      if (result.success) {
        setAiEnabled(result.data.ai_enabled);
      } else {
        setError('Failed to load AI status');
        console.error('Failed to load AI status:', result.error);
      }
    } catch (err) {
      setError('Error loading AI status');
      console.error('Error loading AI status:', err);
    }
  };

  const toggleAI = async () => {
    if (loading || !customerPhone) return;

    setLoading(true);
    setError(null);

    try {
      const newStatus = !aiEnabled;
      const result = await window.electronAPI.toggleAIStatus(customerPhone, newStatus);
      
      if (result.success) {
        setAiEnabled(newStatus);
        
        // Notify parent component of status change
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
        
        // If disabling AI, also trigger human takeover
        if (!newStatus) {
          await window.electronAPI.disableAIForHumanTakeover(customerPhone);
        }
        
        // Optional: Show success notification
        if (window.electronAPI.showNotification) {
          window.electronAPI.showNotification({
            title: 'AI Status Updated',
            body: `AI ${newStatus ? 'enabled' : 'disabled'} for this customer`,
            silent: true
          });
        }
      } else {
        setError('Failed to update AI status');
        console.error('Failed to toggle AI status:', result.error);
      }
    } catch (err) {
      setError('Error updating AI status');
      console.error('Error toggling AI status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!customerPhone) {
    return null;
  }

  return (
    <motion.button
      onClick={toggleAI}
      disabled={loading}
      className={`
        px-3 py-1.5 text-sm rounded-lg transition-all duration-200 
        flex items-center space-x-2 min-w-[90px] justify-center
        ${aiEnabled 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
        }
        ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={!loading ? { scale: 1.05 } : {}}
      whileTap={!loading ? { scale: 0.95 } : {}}
      title={error || `AI is currently ${aiEnabled ? 'enabled' : 'disabled'} for this customer`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
          <span>...</span>
        </>
      ) : (
        <>
          <div className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">
            AI: {aiEnabled ? 'ON' : 'OFF'}
          </span>
        </>
      )}
    </motion.button>
  );
};

export default AIToggleButton;
