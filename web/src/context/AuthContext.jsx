import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_URL } from '../config/env';
import apiClient from '../utils/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Set user immediately from localStorage (optimistic)
        // This ensures user is available immediately when opening new tabs
        setUser(parsedUser);
        
        // Then validate token in background (non-blocking)
        // Only clear user if token is actually invalid (401), not on network errors
        validateToken(parsedUser.token).catch((validationError) => {
          // Only clear user if it's a 401 (unauthorized) error
          // Network errors, timeouts, etc. should not log the user out
          if (validationError?.response?.status === 401) {
            console.error('Token is invalid (401), logging out:', validationError);
            localStorage.removeItem('userData');
            localStorage.removeItem('facilityDetails');
            setUser(null);
          } else {
            // For other errors (network, timeout, etc.), keep user logged in
            // They can still use the app, and validation will retry on next request
            console.warn('Token validation error (non-critical), keeping user logged in:', validationError?.message);
          }
        });
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      localStorage.removeItem('userData');
      localStorage.removeItem('facilityDetails');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async (token) => {
    if (!token) {
      throw new Error('No token provided');
    }
    try {
      const response = await apiClient.get('/api/auth/validate');
      if (response.status === 200) {
        if (response.data.user) {
          // Update user data with latest role information
          const storedUser = localStorage.getItem('userData');
          const currentUser = storedUser ? JSON.parse(storedUser) : {};
          const updatedUser = {
            ...currentUser,
            ...response.data.user,
            token: token,
            loginId: currentUser.loginId // Preserve loginId
          };
          setUser(updatedUser);
          localStorage.setItem('userData', JSON.stringify(updatedUser));
        }
        return true;
      }
      throw new Error('Invalid response status');
    } catch (error) {
      // Re-throw error so caller can check status code
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      if (!user?.token) {
        throw new Error('No token available to refresh');
      }

      const response = await apiClient.post('/api/auth/refresh');
      
      if (response.status === 200 && response.data.token) {
        const updatedUser = {
          ...user,
          ...response.data.user,
          token: response.data.token,
          loginId: user.loginId // Preserve loginId
        };
        
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        return response.data.token;
      }
      
      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      if (error.response?.status === 401) {
        await logout();
      }
      throw error;
    }
  };

  const login = async (username, password, name, deviceInfo, locationInfo) => {
    try {
      setError(null);
      const response = await apiClient.post('/api/auth/login', {
        username,
        password,
        name,
        deviceInfo: deviceInfo || { deviceName: 'Web Browser', platform: 'web' },
        location: locationInfo
      });

      const userData = {
        ...response.data.user,
        token: response.data.token,
        loginId: response.data.loginId
      };

      setUser(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      setError(error.response?.data?.message || error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user?.token) {
        await apiClient.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('userData');
      localStorage.removeItem('facilityDetails');
    }
  };

  const getActiveSessions = async () => {
    try {
      const response = await apiClient.get('/api/auth/sessions');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
      }
      console.error('Error fetching active sessions:', error);
      throw error;
    }
  };

  const updateFacilityDetails = async (facilityDetails) => {
    try {
      if (!user?.token || !user?.loginId) {
        throw new Error('User not properly authenticated');
      }

      const isValid = await validateToken(user.token);
      if (!isValid) {
        await logout();
        throw new Error('Session expired. Please login again.');
      }

      const updatedFacilityDetails = {
        ...facilityDetails,
        Lat: facilityDetails.Lat || facilityDetails.latitude || 0
      };

      const response = await apiClient.post(
        '/api/auth/facility',
        {
          loginId: user.loginId,
          facilityDetails: updatedFacilityDetails
        }
      );

      localStorage.setItem('facilityDetails', JSON.stringify(updatedFacilityDetails));
      return response.data;
    } catch (error) {
      console.error('Error updating facility details:', error.response?.data || error);
      if (error.response?.status === 401) {
        await logout();
      }
      throw new Error(error.response?.data?.message || 'Failed to update facility details');
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    getActiveSessions,
    updateFacilityDetails,
    validateToken,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

