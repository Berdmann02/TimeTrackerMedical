import axios from 'axios';
import { API_URL } from '../config';

class AuthService {
  // Login method
  async login(email: string, password: string) {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password }, { withCredentials: true });
    return response.data.user;
  }

  // Logout method
  async logout() {
    await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
  }

  // Fetch current user profile
  async fetchProfile() {
    const response = await axios.get(`${API_URL}/auth/profile`, { withCredentials: true });
    return response.data;
  }
}

export const authService = new AuthService(); 