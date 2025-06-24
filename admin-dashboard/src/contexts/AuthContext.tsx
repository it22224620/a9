'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  loginWithKey: (adminKey: string) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = async (credentials: { username: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        const { admin, token } = response.data;
        
        // Store auth data
        Cookies.set('admin_token', token, { expires: 1 }); // 1 day
        Cookies.set('admin_user', JSON.stringify(admin), { expires: 1 });
        
        setUser(admin);
        toast.success('Login successful!');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithKey = async (adminKey: string) => {
    try {
      setIsLoading(true);
      
      // Store admin key
      Cookies.set('admin_key', adminKey, { expires: 1 });
      
      // Create a mock admin user for API key authentication
      const mockAdmin = {
        id: 'api-key-admin',
        username: 'API Admin',
        email: 'admin@system.com',
        role: 'super_admin',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      
      Cookies.set('admin_user', JSON.stringify(mockAdmin), { expires: 1 });
      setUser(mockAdmin);
      
      toast.success('Authenticated with admin key!');
      return true;
    } catch (error: any) {
      console.error('Admin key login error:', error);
      toast.error('Invalid admin key');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear all auth data
    Cookies.remove('admin_token');
    Cookies.remove('admin_key');
    Cookies.remove('admin_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const refreshAuth = async () => {
    try {
      const token = Cookies.get('admin_token');
      const adminKey = Cookies.get('admin_key');
      const userData = Cookies.get('admin_user');

      if (token) {
        // Try to refresh JWT token
        const response = await authAPI.refreshToken();
        if (response.success) {
          Cookies.set('admin_token', response.data.token, { expires: 1 });
        }
      } else if (adminKey && userData) {
        // Use stored admin key and user data
        setUser(JSON.parse(userData));
      } else {
        // No valid auth data
        logout();
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = Cookies.get('admin_token');
        const adminKey = Cookies.get('admin_key');
        const userData = Cookies.get('admin_user');

        if (token && userData) {
          // JWT authentication
          try {
            const response = await authAPI.getProfile();
            if (response.success) {
              setUser(response.data);
            } else {
              throw new Error('Profile fetch failed');
            }
          } catch (error) {
            // Try to refresh token
            await refreshAuth();
          }
        } else if (adminKey && userData) {
          // API key authentication
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    loginWithKey,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}