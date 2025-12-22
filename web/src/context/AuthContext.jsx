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
        const isValid = await validateToken(parsedUser.token);
        if (!isValid) {
          localStorage.removeItem('userData');
          localStorage.removeItem('facilityDetails');
          setUser(null);
        }
        // User is set in validateToken if valid
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
    if (!token) return false;
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
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
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
    validateToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

