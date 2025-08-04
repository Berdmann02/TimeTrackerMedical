import axios from 'axios';
import { API_URL } from '../config';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
});

// Add request interceptor for Safari compatibility
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure proper headers for Safari
    if (config.headers) {
      config.headers['Content-Type'] = 'application/json';
      config.headers['Accept'] = 'application/json';
    }
    
    // Safari-specific debugging
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    if (isSafari) {
      console.log('Safari request:', {
        url: config.url,
        method: config.method,
        withCredentials: config.withCredentials,
        headers: config.headers
      });
    }
    
    // Use token from sessionStorage for all browsers (Safari-compatible)
    const token = sessionStorage.getItem('auth_token');
    if (token && !config.headers.Authorization) {
      console.log('Using sessionStorage token for request:', {
        url: config.url,
        hasToken: !!token,
        tokenLength: token.length
      });
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!token) {
      console.log('No sessionStorage token found for request:', {
        url: config.url,
        hasAuthorization: !!config.headers.Authorization
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log Safari-specific errors
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    
    if (isSafari) {
      console.error('Safari error detected:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        withCredentials: error.config?.withCredentials
      });
      
      // If it's a 401 error in Safari, it's likely a cookie issue
      if (error.response?.status === 401) {
        console.error('Safari 401 error - likely cookie authentication issue');
        // Clear invalid token
        sessionStorage.removeItem('auth_token');
      }
    }
    
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('Safari network error detected:', error);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 