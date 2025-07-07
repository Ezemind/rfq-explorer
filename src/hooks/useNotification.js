import { useState, useCallback } from 'react';

export const useInlineNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((type, message, options = {}) => {
    setNotification({
      type,
      message,
      id: Date.now(),
      ...options
    });

    // Auto-dismiss after duration
    const duration = options.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        setNotification(null);
      }, duration);
    }
  }, []);

  const success = useCallback((message, options = {}) => {
    showNotification('success', message, options);
  }, [showNotification]);

  const error = useCallback((message, options = {}) => {
    showNotification('error', message, { duration: 7000, ...options });
  }, [showNotification]);

  const warning = useCallback((message, options = {}) => {
    showNotification('warning', message, { duration: 6000, ...options });
  }, [showNotification]);

  const info = useCallback((message, options = {}) => {
    showNotification('info', message, options);
  }, [showNotification]);

  const clear = useCallback(() => {
    setNotification(null);
  }, []);

  const dismiss = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    success,
    error,
    warning,
    info,
    clear,
    dismiss,
    showNotification
  };
};

// Hook for form notifications specifically
export const useFormNotification = () => {
  const notification = useInlineNotification();
  
  const validateAndNotify = useCallback((isValid, successMessage, errorMessage) => {
    if (isValid) {
      notification.success(successMessage);
      return true;
    } else {
      notification.error(errorMessage);
      return false;
    }
  }, [notification]);

  const handleAsyncOperation = useCallback(async (operation, loadingMessage, successMessage, errorMessage) => {
    try {
      notification.info(loadingMessage || 'Processing...', { duration: 0 });
      const result = await operation();
      notification.success(successMessage || 'Operation completed successfully');
      return result;
    } catch (error) {
      notification.error(errorMessage || `Error: ${error.message}`);
      throw error;
    }
  }, [notification]);

  return {
    ...notification,
    validateAndNotify,
    handleAsyncOperation
  };
};
