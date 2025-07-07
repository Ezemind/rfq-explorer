import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      dismissible: true,
      ...toast
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options
    });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      duration: 7000, // Longer duration for errors
      ...options
    });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      duration: 6000,
      ...options
    });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options
    });
  }, [addToast]);

  const loading = useCallback((message, options = {}) => {
    return addToast({
      type: 'loading',
      message,
      duration: 0, // Don't auto-dismiss loading toasts
      dismissible: false,
      ...options
    });
  }, [addToast]);

  const promise = useCallback((promiseOrFunction, options = {}) => {
    const {
      loading: loadingMessage = 'Loading...',
      success: successMessage = 'Success!',
      error: errorMessage = 'Something went wrong',
    } = options;

    const loadingId = loading(loadingMessage);

    const handlePromise = async () => {
      try {
        const result = typeof promiseOrFunction === 'function' 
          ? await promiseOrFunction() 
          : await promiseOrFunction;
        
        removeToast(loadingId);
        success(typeof successMessage === 'function' ? successMessage(result) : successMessage);
        
        return result;
      } catch (err) {
        removeToast(loadingId);
        error(typeof errorMessage === 'function' ? errorMessage(err) : errorMessage);
        throw err;
      }
    };

    return handlePromise();
  }, [loading, success, error, removeToast]);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      const id = addToast({
        type: 'confirm',
        message,
        duration: 0,
        dismissible: false,
        onConfirm: () => {
          removeToast(id);
          resolve(true);
        },
        onCancel: () => {
          removeToast(id);
          resolve(false);
        },
        ...options
      });
    });
  }, [addToast, removeToast]);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    loading,
    promise,
    confirm,
    clear
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};
