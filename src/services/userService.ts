import axiosInstance from './axiosConfig';
import { isAxiosError } from 'axios';
import {API_URL} from '../config';

// Interface for the data returned by most GET endpoints (getUsers, getUserById, getUsersBySiteId)
export interface UserListItem {
    id: number;             // User database ID (now provided by backend)
    name: string;           // Concatenated first_name + ' ' + last_name
    email: string;
    role: "admin" | "nurse" | "pharmacist";
    primary_site: string;   // Site name (not ID)
    assigned_sites: string[]; // Array of site names (not IDs)
}

// Interface for the full user data (used for create/update operations)
export interface User {
    id?: number;
    first_name: string;
    last_name: string;
    email: string;
    password?: string;
    current_password?: string;
    new_password?: string;
    role: "admin" | "nurse" | "pharmacist";
    created_at?: Date;
    primarysite_id: number;
    assignedsites_ids: number[];
    // Legacy fields for backward compatibility (will be populated by mapping)
    primarysite?: string;
    assignedsites?: string[];
}

export interface CreateUserDTO {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: "admin" | "nurse" | "pharmacist";
    primarysite_id: number;
    assignedsites_ids: number[];
}

// Returns: Array of UserListItem objects with:
// - name: string (concatenated first_name + ' ' + last_name)
// - email: string
// - role: "admin" | "nurse" | "pharmacist"
// - primary_site: string (site name)
// - assigned_sites: string[] (array of site names)
export const getUsers = async(): Promise<UserListItem[]> => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users`);
        return response.data;
    } catch (error: unknown) {
        console.error('Error fetching users:', error);
        if (isAxiosError(error)) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.request) {
                throw new Error('No response from server');
            }
        }
        throw new Error('Failed to fetch users');
    }
};

// Returns: Single UserListItem object with:
// - name: string (concatenated first_name + ' ' + last_name)
// - email: string
// - role: "admin" | "nurse" | "pharmacist"
// - primary_site: string (site name)
// - assigned_sites: string[] (array of site names)
export const getUserById = async (id: number | string): Promise<UserListItem> => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error(`Error fetching user with ID ${id}:`, error);
        if (isAxiosError(error)) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.request) {
                throw new Error('No response from server');
            }
        }
        throw new Error('Failed to fetch user');
    }
};

// Expects: CreateUserDTO object with:
// - first_name: string
// - last_name: string
// - email: string
// - password: string
// - role: "admin" | "nurse" | "pharmacist"
// - primarysite_id: number
// - assignedsites_ids: number[]
// Returns: Full User object with all database fields including id and created_at
export const createUser = async (userData: CreateUserDTO): Promise<User> => {
    try {
        const response = await axiosInstance.post(`${API_URL}/users`, userData);
        return response.data;
    } catch (error: unknown) {
        console.error('Error creating user:', error);
        if (isAxiosError(error)) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.request) {
                throw new Error('No response from server');
            }
        }
        throw new Error('Failed to create user');
    }
};

// Expects: Partial<User> object with any fields to update
// Returns: Full User object with all database fields
export const updateUser = async (id: number| string, userData: Partial<User>): Promise<User> => {
    try {
        const response = await axiosInstance.put(`${API_URL}/users/${id}`, userData);
        return response.data;
    } catch (error: unknown) {
        console.error(`Error updating user with ID ${id}:`, error);
        if (isAxiosError(error)) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.request) {
                throw new Error('No response from server');
            }
        }
        throw new Error('Failed to update user');
    }
};

// Returns: void (just confirms deletion)
export const deleteUser = async (id: number| string): Promise<void> => {
    try {
        await axiosInstance.delete(`${API_URL}/users/${id}`);
    } catch (error: unknown) {
        console.error(`Error deleting user with ID ${id}:`, error);
        if (isAxiosError(error)) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.request) {
                throw new Error('No response from server');
            }
        }
        throw new Error('Failed to delete user');
    }
}

// Returns: Array of UserListItem objects for users associated with the site
// (either as primary site or in assigned sites) with:
// - name: string (concatenated first_name + ' ' + last_name)
// - email: string
// - role: "admin" | "nurse" | "pharmacist"
// - primary_site: string (site name)
// - assigned_sites: string[] (array of site names)
export const getUsersBySiteId = async (siteId: number): Promise<UserListItem[]> => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users/site/${siteId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching users for site ID ${siteId}:`, error);
        throw error;
    }
};

// Legacy function for backward compatibility
// Returns: Array of UserListItem objects filtered by site name
export const getUsersBySite = async (siteName: string): Promise<UserListItem[]> => {
    try {
        // For backward compatibility, we still support getting users by site name
        // This will need to be updated to get the site ID first and then use the optimized endpoint
        const allUsers = await getUsers();
        return allUsers.filter(user => 
            user.primary_site === siteName || 
            (user.assigned_sites && user.assigned_sites.includes(siteName))
        );
    } catch (error) {
        console.error(`Error fetching users for site ${siteName}:`, error);
        throw error;
    }
};