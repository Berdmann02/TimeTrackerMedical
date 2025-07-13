import axiosInstance from './axiosConfig';
import { API_URL } from '../config';

class AuthService {
  // Login method
  async login(email: string, password: string) {
    const response = await axiosInstance.post(`${API_URL}/auth/login`, { email, password });
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

export const authService = new AuthService(); 