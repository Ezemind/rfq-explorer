import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        loading: false, 
        error: null 
      };
    case 'AUTH_ERROR':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        loading: false, 
        error: action.payload 
      };
    case 'AUTH_LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        loading: false, 
        error: null 
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export default function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing session on app start
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      console.log('🔍 Checking existing session...');
      
      // Wait a bit for electronAPI to be available
      if (!window.electronAPI) {
        console.log('⏳ ElectronAPI not ready, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const savedUser = localStorage.getItem('bobexplorer_user');
      if (savedUser) {
        console.log('👤 Found saved user session');
        const user = JSON.parse(savedUser);
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } else {
        console.log('📝 No saved session found, showing login');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('❌ Session check error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      // Wait for electronAPI to be available
      if (!window.electronAPI) {
        console.log('⏳ Waiting for electronAPI...');
        await new Promise(resolve => {
          const checkAPI = () => {
            if (window.electronAPI) {
              resolve();
            } else {
              setTimeout(checkAPI, 100);
            }
          };
          checkAPI();
        });
      }

      console.log('🔐 Attempting login with electronAPI.authLogin...');
      const result = await window.electronAPI.authLogin(credentials);
      console.log('🔐 Login result:', result);
      
      if (result.success) {
        localStorage.setItem('bobexplorer_user', JSON.stringify(result.user));
        dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
        return { success: true };
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = 'Login failed. Please check your connection and try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('bobexplorer_user');
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
