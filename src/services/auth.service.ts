import axiosInstance from './axiosConfig';
import { API_URL } from '../config';

class AuthService {
  // Login method
  async login(email: string, password: string) {
    const response = await axiosInstance.post(`${API_URL}/auth/login`, { email, password });
    
    // Safari-specific debugging
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    if (isSafari) {
      console.log('Safari login response:', {
        status: response.status,
        cookies: document.cookie,
        responseHeaders: response.headers
      });
      

    }
    
    return response.data.user;
  }

  // Logout method
  async logout() {
    await axiosInstance.post(`${API_URL}/auth/logout`, {});
  }

  // Fetch current user profile
  async fetchProfile() {
    const response = await axiosInstance.get(`${API_URL}/auth/profile`);
    return response.data;
  }


}

export default new AuthService(); 