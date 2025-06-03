import axios from 'axios';
import { API_URL } from '../config';

interface User {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  primarysite: string;
  assignedsites: string[];
  created_at?: Date;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // Login method
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
        email,
        password
      });

      // Store token
      localStorage.setItem(this.TOKEN_KEY, response.data.access_token);
      // Store user info
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));

      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Logout method
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    delete axios.defaults.headers.common['Authorization'];
  }

  // Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Get user role
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  // Check if user is admin
  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'admin' || role === 'admin';
  }

  // Check if user is nurse
  isNurse(): boolean {
    return this.getUserRole() === 'nurse';
  }

  // Check if user is pharmacist
  isPharmacist(): boolean {
    return this.getUserRole() === 'pharmacist';
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Initialize auth headers
  initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}

export const authService = new AuthService();

// Initialize auth headers on service creation
authService.initializeAuth(); 