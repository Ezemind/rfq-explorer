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
      const savedUser = localStorage.getItem('bobexplorer_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Session check error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const result = await window.electronAPI.login(credentials);
      
      if (result.success) {
        localStorage.setItem('bobexplorer_user', JSON.stringify(result.user));
        dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
        return { success: true };
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Login failed. Please try again.';
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
