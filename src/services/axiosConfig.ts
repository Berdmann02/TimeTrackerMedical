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
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('Safari network error detected:', error);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 