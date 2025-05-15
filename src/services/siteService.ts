import axios from 'axios';
import { API_URL } from '../config';

export interface Site {
  id?: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  is_active: boolean;
  created_at?: Date;
}

export interface CreateSiteDto {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  is_active?: boolean;
}

export interface UpdateSiteDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  is_active?: boolean;
}

export const getAllSites = async (): Promise<Site[]> => {
  try {
    const response = await axios.get(`${API_URL}/sites`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sites:', error);
    return [];
  }
};

export const getSiteById = async (id: number): Promise<Site> => {
  const response = await axios.get(`${API_URL}/sites/${id}`);
  return response.data;
};

export const getSiteByName = async (name: string): Promise<Site> => {
  const response = await axios.get(`${API_URL}/sites/name/${name}`);
  return response.data;
};

export const createSite = async (site: CreateSiteDto): Promise<Site> => {
  const response = await axios.post(`${API_URL}/sites`, site);
  return response.data;
};

export const updateSite = async (id: number, site: UpdateSiteDto): Promise<Site> => {
  const response = await axios.put(`${API_URL}/sites/${id}`, site);
  return response.data;
};

export const deleteSite = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/sites/${id}`);
};

export const getAllSiteNames = async (): Promise<string[]> => {
  try {
    const sites = await getAllSites();
    return sites.map(site => site.name);
  } catch (error) {
    console.error('Error fetching site names:', error);
    return [];
  }
}; 