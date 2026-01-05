import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('workasana_token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.user);
    } catch (error) {
      localStorage.removeItem('workasana_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login(email, password);
      
      localStorage.setItem('workasana_token', response.token);
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.name}!`);
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      toast.error('Login failed. Please check your credentials.');
      return { success: false, error: error.message };
    }
  };

  const signup = async (name, email, password) => {
    try {
      setError(null);
      const response = await authAPI.signup(name, email, password);
      
      localStorage.setItem('workasana_token', response.token);
      setUser(response.user);
      toast.success(`Welcome to Workasana, ${response.user.name}!`);
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      toast.error('Signup failed. Please try again.');
      return { success: false, error: error.message };
    }
  };



  const logout = () => {
    localStorage.removeItem('workasana_token');
    setUser(null);
    setError(null);
    toast.info('You have been logged out successfully');
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};