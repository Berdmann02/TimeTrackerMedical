import axios from 'axios';
import { API_URL } from '../config';

export interface LoginResponse {
  access_token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, credentials);
    return response.data;
  },

  setToken(token: string) {
    localStorage.setItem('access_token', token);
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  removeToken() {
    localStorage.removeItem('access_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  logout() {
    this.removeToken();
    // You can add any additional cleanup here, like clearing other stored data
    localStorage.clear(); // Clear all localStorage data
  }
}; 