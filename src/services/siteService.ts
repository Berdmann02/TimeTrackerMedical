import axios from 'axios';
import { API_URL } from '../config';
import { authService } from './auth.service';

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

export interface SiteWithBuildings {
  site_name: string;
  building_names: string[];
}

export const createSite = async (data: CreateSiteDto): Promise<Site> => {
  const response = await axios.post(`${API_URL}/sites`, data);
  return response.data;
};

export const getSites = async (): Promise<Site[]> => {
  // If user is admin, get all sites
  if (authService.isAdmin()) {
    return await getAllSitesForAdmin();
  }
  
  // For non-admin users, get sites based on user ID
  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id;
  const url = userId ? `${API_URL}/sites?userId=${userId}` : `${API_URL}/sites`;
  const response = await axios.get(url);
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
    const response = await axios.put(`${API_URL}/sites/${id}`, data);
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

export const getSitesAndBuildings = async (): Promise<SiteWithBuildings[]> => {
  try {
    // If user is admin, get all sites and buildings using admin endpoint
    if (authService.isAdmin()) {
      const response = await axios.get(`${API_URL}/sites/admin/sites-and-buildings`);
      return response.data;
    }
    
    // For non-admin users, get sites and buildings based on user ID
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id;
    const url = userId ? `${API_URL}/sites/sites-and-buildings?userId=${userId}` : `${API_URL}/sites/sites-and-buildings`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching sites and buildings:', error);
    throw error;
  }
};

export const getAllSitesForAdmin = async (): Promise<Site[]> => {
  try {
    const response = await axios.get(`${API_URL}/sites/admin/all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all sites for admin:', error);
    throw error;
  }
}; 