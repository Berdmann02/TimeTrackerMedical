import axiosInstance from './axiosConfig';
import { API_URL } from '../config';

class AuthService {
  // Login method
  async login(email: string, password: string) {
    const response = await axiosInstance.post(`${API_URL}/auth/login`, { email, password });
    
    console.log('Login response received:', {
      status: response.status,
      hasAccessToken: !!response.data.access_token,
      hasUser: !!response.data.user,
      responseData: response.data
    });
    
    // Safari-specific debugging
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    if (isSafari) {
      console.log('Safari login response:', {
        status: response.status,
        cookies: document.cookie,
        responseHeaders: response.headers
      });
      
      // Store token in sessionStorage for Safari (more secure than localStorage)
      if (response.data.access_token) {
        sessionStorage.setItem('auth_token', response.data.access_token);
        console.log('Safari: Stored token in sessionStorage');
      }
    }
    
    // Store token for all browsers as fallback
    if (response.data.access_token) {
      sessionStorage.setItem('auth_token', response.data.access_token);
      console.log('Stored access token in sessionStorage for all browsers');
    } else {
      console.warn('No access_token received in login response');
    }
    
    return response.data.user;
  }

  // Logout method
  async logout() {
    await axiosInstance.post(`${API_URL}/auth/logout`, {});
    
    // Clear all storage
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    console.log('Cleared all auth tokens');
  }

  // Fetch current user profile
  async fetchProfile() {
    const response = await axiosInstance.get(`${API_URL}/auth/profile`);
    return response.data;
  }

  // Get token from multiple sources (Safari-compatible)
  getAuthToken(): string | null {
    // Check sessionStorage first (Safari-friendly)
    const sessionToken = sessionStorage.getItem('auth_token');
    if (sessionToken) {
      console.log('Found token in sessionStorage');
      return sessionToken;
    }
    
    // Fallback to localStorage
    const localToken = localStorage.getItem('auth_token');
    if (localToken) {
      console.log('Found token in localStorage, moving to sessionStorage');
      // Move to sessionStorage for better Safari compatibility
      sessionStorage.setItem('auth_token', localToken);
      localStorage.removeItem('auth_token');
      return localToken;
    }
    
    console.log('No auth token found in any storage');
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getAuthToken() !== null;
  }

  // Set auth token (for manual token management)
  setAuthToken(token: string): void {
    sessionStorage.setItem('auth_token', token);
  }
}

export default new AuthService(); 