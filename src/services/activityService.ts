import axios from 'axios';
import type { Activity } from './patientService';
import { API_URL } from '../config';
import { getUserInitialsFromAuthUser } from '../utils/userUtils';

export interface CreateActivityDTO {
  patient_id: number;
  user_id: number;
  activity_type: string;
  time_spent: number;
  building: string;
  notes?: string;
  insurance?: string;
  user_initials?: string;
  medical_checks?: {
    medical_records: boolean;
    bp_at_goal: boolean;
    hospital_visit: boolean;
    a1c_at_goal: boolean;
    benzodiazepines: boolean;
    antipsychotics: boolean;
    opioids: boolean;
    fall_since_last_visit: boolean;
  };
}

export const getActivityById = async (id: number | string): Promise<Activity | Activity[]> => {
  try {
    if (id === 'all') {
      const response = await axios.get(`${API_URL}/activities`);
      return response.data;
    }
    const response = await axios.get(`${API_URL}/activities/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching activity with ID ${id}:`, error);
    throw error;
  }
};

// New optimized function to get activities with patient and user details
export const getActivitiesWithDetails = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}/activities/with-details`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activities with details:', error);
    throw error;
  }
};

export const createActivity = async (activityData: CreateActivityDTO): Promise<Activity> => {
  try {
    // Map our frontend DTO to match the backend schema
    const backendActivityData = {
      patient_id: activityData.patient_id,
      user_id: activityData.user_id,
      activity_type: activityData.activity_type,
      notes: activityData.notes || '',
      site_name: 'CP Greater San Antonio', // Default value
      // Use both field names to ensure compatibility
      service_datetime: new Date().toISOString(),
      created_at: new Date().toISOString(),
      // Use both field names to ensure compatibility
      duration_minutes: activityData.time_spent,
      time_spent: activityData.time_spent,
      building: activityData.building,
      insurance: activityData.insurance || '',
      user_initials: activityData.user_initials || '',
      medical_records: activityData.medical_checks?.medical_records || false,
      bp_at_goal: activityData.medical_checks?.bp_at_goal || false,
      hospital_visit: activityData.medical_checks?.hospital_visit || false,
      a1c_at_goal: activityData.medical_checks?.a1c_at_goal || false,
      benzodiazepines: activityData.medical_checks?.benzodiazepines || false,
      antipsychotics: activityData.medical_checks?.antipsychotics || false,
      opioids: activityData.medical_checks?.opioids || false,
      fall_since_last_visit: activityData.medical_checks?.fall_since_last_visit || false
    };
    
    console.log('Sending activity data to backend:', backendActivityData);
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