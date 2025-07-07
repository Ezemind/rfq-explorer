import React, { useState, useEffect } from 'react';

const AIStatusIndicator = ({ customerPhone, className = '' }) => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerPhone) {
      checkAIStatus();
    }
  }, [customerPhone]);

  const checkAIStatus = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.canAIRespond(customerPhone);
      if (result.success) {
        setAiEnabled(result.data.can_respond);
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
      // Default to enabled if there's an error
      setAiEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading || aiEnabled) {
    // Don't show anything if AI is enabled or still loading
    return null;
  }

  return (
    <div 
      className={`inline-flex items-center ${className}`}
      title="AI responses are disabled for this customer"
    >
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <span className="ml-1 text-xs text-red-600 dark:text-red-400 font-medium">
        AI OFF
      </span>
    </div>
  );
};

export default AIStatusIndicator;
