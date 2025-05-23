import axios from 'axios';
import { API_URL } from '../config';

export interface Site {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSiteDto {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface UpdateSiteDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  is_active?: boolean;
}

export const createSite = async (data: CreateSiteDto): Promise<Site> => {
  const response = await axios.post(`${API_URL}/sites`, data);
  return response.data;
};

export const getSites = async (): Promise<Site[]> => {
  const response = await axios.get(`${API_URL}/sites`);
  return response.data;
};

export const getSiteById = async (id: number): Promise<Site> => {
  try {
    const response = await axios.get(`${API_URL}/sites/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching site:', error);
    throw error;
  }
};

export const getSiteByName = async (name: string): Promise<Site> => {
  const response = await axios.get(`${API_URL}/sites/name/${name}`);
  return response.data;
};

export const updateSite = async (id: number, data: Partial<CreateSiteDto>): Promise<Site> => {
  try {
    const response = await axios.patch(`${API_URL}/sites/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating site:', error);
    throw error;
  }
};

export const deleteSite = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/sites/${id}`);
  } catch (error) {
    console.error('Error deleting site:', error);
    throw error;
  }
};

export const getAllSiteNames = async (): Promise<string[]> => {
  try {
    const sites = await getSites();
    return sites.map(site => site.name);
  } catch (error) {
    console.error('Error fetching site names:', error);
    return [];
  }
}; 