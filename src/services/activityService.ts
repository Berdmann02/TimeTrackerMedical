import axios from 'axios';
import type { Activity } from './patientService';

const API_URL = 'https://time-tracker-medical-backend.onrender.com';

export interface CreateActivityDTO {
  patient_id: number;
  activity_type: string;
  user_initials: string;
  time_spent: number;
  notes?: string;
}

export const getActivityById = async (id: number | string): Promise<Activity> => {
  try {
    const response = await axios.get(`${API_URL}/activities/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching activity with ID ${id}:`, error);
    throw error;
  }
};

export const createActivity = async (activityData: CreateActivityDTO): Promise<Activity> => {
  try {
    // Map our frontend DTO to match the backend schema
    const backendActivityData = {
      patient_id: activityData.patient_id,
      activity_type: activityData.activity_type,
      // Use both field names to ensure compatibility
      personnel_initials: activityData.user_initials,
      user_initials: activityData.user_initials,
      notes: activityData.notes || '',
      site_name: 'CP Greater San Antonio', // Default value
      // Use both field names to ensure compatibility
      service_datetime: new Date().toISOString(),
      created_at: new Date().toISOString(),
      // Use both field names to ensure compatibility
      duration_minutes: activityData.time_spent,
      time_spent: activityData.time_spent
    };
    
    const response = await axios.post(`${API_URL}/activities`, backendActivityData);
    return response.data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

export const updateActivity = async (id: number | string, activityData: any): Promise<Activity> => {
  try {
    // Backend expects the PUT method
    const response = await axios.put(`${API_URL}/activities/${id}`, activityData);
    return response.data;
  } catch (error) {
    console.error(`Error updating activity with ID ${id}:`, error);
    throw error;
  }
};

export const deleteActivity = async (id: number | string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/activities/${id}`);
  } catch (error) {
    console.error(`Error deleting activity with ID ${id}:`, error);
    throw error;
  }
};

// Get all available activity types
export const getActivityTypes = async (): Promise<string[]> => {
  try {
    // Since there's no activity-types endpoint in the backend,
    // we'll provide a hardcoded list of common activity types
    // This can be replaced with an API call once the endpoint is implemented
    return [
      "Assess medical/functional/psychosocial needs",
      "Conduct risk assessment",
      "Coordinate care with other service providers",
      "Discuss & monitor patient condition",
      "Manage care transition",
      "Medications management oversight",
      "Perform medication reconciliation",
      "Provide chronic‑condition education",
      "Screen for preventive services",
      "Other"
    ];
  } catch (error) {
    console.error('Error fetching activity types:', error);
    throw error;
  }
}; 