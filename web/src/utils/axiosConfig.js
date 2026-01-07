import axios from 'axios';
import { API_URL } from '../config/env';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create axios instance with timeout
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry function for failed requests
const retryRequest = async (error) => {
  const config = error.config;
  
  if (!config || !config.retry) {
    config.retry = 0;
  }

  config.retry += 1;

  if (config.retry > MAX_RETRIES) {
    return Promise.reject(error);
  }

  // Wait before retrying with exponential backoff
  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config.retry));

  return apiClient(config);
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Retry on network errors or timeout
    if (
      !error.response &&
      (error.code === 'ECONNABORTED' || error.message === 'Network Error' || error.message.includes('timeout'))
    ) {
      return retryRequest(error);
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      // Clear user data and redirect to login
      localStorage.removeItem('userData');
      localStorage.removeItem('facilityDetails');
      
      // Only redirect if we're not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;


