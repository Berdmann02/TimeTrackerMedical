import axios from 'axios';
import {API_URL} from '../config';

export interface User {
    id?:number;
    first_name:string;
    last_name:string;
    email:string;
    password:string;
    role: string;
    created_at?:string;
    primarysite:string;
    assignedsites:string[];
}

export interface CreateUserDTO {
    first_name:string;
    last_name:string;
    email:string;
    password:string;
    role:string;
    primarysite:string;
    assignedsites:string[];
}

export const getUsers = async():Promise<User[]> => {
    try{
        const response = await axios.get(`${API_URL}/users`);
        return response.data;
    }catch(error){
        console.error('Error fetching users:',error);
        throw error;
    }
};

export const getUserById = async (id:number | string): Promise<User> => {
    try {
        const response = await axios.get(`${API_URL}/users/${id}`);
        return response.data;
    }catch(error){
        console.error(`Error fetching user with ID ${id}:`,error);
        throw error;
    }
};

export const createUser = async (userData: CreateUserDTO): Promise<User> => {
    try {
        console.log('Creating user with data:', userData); // Debug log
        const response = await axios.post(`${API_URL}/users`, userData);
        console.log('Server response:', response.data); // Debug log
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response:', error.response.data);
                throw new Error(error.response.data.message || 'Failed to create user');
            } else if (error.request) {
                // The request was made but no response was received
                throw new Error('No response from server');
            }
        }
        throw error;
    }
};

export const updateUser = async (id:number| string,userData: Partial<User>): Promise<User> => {
    try{
        const response = await axios.put(`${API_URL}/users/${id}`,userData);
        return response.data;
    }catch(error){
        console.error(`Error updating user with ID ${id}:`,error);
        throw error;
    }
};

export const deleteUser = async (id:number| string): Promise<void> => {
    try{
        await axios.delete(`${API_URL}/users/${id}`);
    }catch(error){
        console.error(`Error deleting user with ID ${id}:`,error);
        throw error;
    }
}


