import axios from 'axios';
import { API_URL } from '../config';

export interface Building {
    id: number;
    name: string;
    site_id: number;
    is_active: boolean;
    created_at: string;
}

export interface BuildingWithSiteInfo extends Building {
    site_name: string;
    site_address: string;
    site_city: string;
    site_state: string;
    site_zip: string;
    site_is_active: boolean;
    site_created_at: string;
}

export const getBuildings = async (): Promise<Building[]> => {
    const response = await axios.get(`${API_URL}/buildings`);
    return response.data;
};

export const getBuildingsWithSiteInfo = async (): Promise<BuildingWithSiteInfo[]> => {
    const response = await axios.get(`${API_URL}/buildings/with-site-info/all`);
    return response.data;
};

export const getBuildingsBySiteId = async (siteId: number): Promise<Building[]> => {
    const response = await axios.get(`${API_URL}/buildings/site/${siteId}`);
    return response.data;
};

export const createBuilding = async (building: Omit<Building, 'id' | 'created_at'>): Promise<Building> => {
    const response = await axios.post(`${API_URL}/buildings`, building);
    return response.data;
};

export const updateBuilding = async (id: number, building: Partial<Building>): Promise<Building> => {
    const response = await axios.put(`${API_URL}/buildings/${id}`, building);
    return response.data;
};

export const deleteBuilding = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/buildings/${id}`);
}; 