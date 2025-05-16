import axios from 'axios';
import { authService } from './auth.service';

const API_URL = 'https://time-tracker-medical-backend.onrender.com';

export interface UserAccount {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "Nurse" | "pharmacist";
  isActive: boolean;
  primarySite: string;
  assignedSites?: string[];
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "Nurse" | "pharmacist";
  primarySite: string;
  assignedSites?: string[];
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: "admin" | "Nurse" | "pharmacist";
  isActive?: boolean;
  primarySite?: string;
  assignedSites?: string[];
}

export const userService = {
  async getUsers(): Promise<UserAccount[]> {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token');

    const response = await axios.get<UserAccount[]>(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  async createUser(userData: CreateUserData): Promise<UserAccount> {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token');

    const response = await axios.post<UserAccount>(`${API_URL}/users`, userData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  async updateUser(userId: string, userData: UpdateUserData): Promise<UserAccount> {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token');

    const response = await axios.patch<UserAccount>(`${API_URL}/users/${userId}`, userData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  async deleteUser(userId: string): Promise<void> {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token');

    await axios.delete(`${API_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}; 