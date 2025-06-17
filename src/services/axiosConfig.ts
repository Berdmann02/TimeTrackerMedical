import axios from 'axios';
import { authService } from './auth.service';

// Add a request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`);
        const { access_token } = response.data;

        // Update the token in localStorage and axios headers
        localStorage.setItem('auth_token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        // Retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout and redirect to login
        if (!window.location.pathname.includes('/login')) {
          authService.logout();
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
); 