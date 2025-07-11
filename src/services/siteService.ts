import axiosInstance from './axiosConfig';
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
  const response = await axiosInstance.post(`${API_URL}/sites`, data);
  return response.data;
};

export const getSites = async (): Promise<Site[]> => {
  const response = await axiosInstance.get(`${API_URL}/sites`);
  return response.data;
};

export const getSiteById = async (id: number): Promise<Site> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/sites/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching site:', error);
    throw error;
  }
};

export const getSiteByName = async (name: string): Promise<Site> => {
  const response = await axiosInstance.get(`${API_URL}/sites/name/${name}`);
  return response.data;
};

export const updateSite = async (id: number, data: Partial<CreateSiteDto>): Promise<Site> => {
  try {
    const response = await axiosInstance.put(`${API_URL}/sites/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating site:', error);
    throw error;
  }
};

export const deleteSite = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${API_URL}/sites/${id}`);
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
    const response = await axiosInstance.get(`${API_URL}/sites/sites-and-buildings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sites and buildings:', error);
    throw error;
  }
};

export const getAllSitesForAdmin = async (): Promise<Site[]> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/sites/admin/all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all sites for admin:', error);
    throw error;
  }
}; 