import axios from 'axios';
import type { Activity } from './patientService';
import { API_URL } from '../config';

export interface CreateActivityDTO {
  patient_id: number;
  activity_type: string;
  time_spent: number;
  building: string;
  notes?: string;
  insurance?: string;
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
      medical_records: activityData.medical_checks?.medical_records || false,
      bp_at_goal: activityData.medical_checks?.bp_at_goal || false,
      hospital_visit: activityData.medical_checks?.hospital_visit || false,
      a1c_at_goal: activityData.medical_checks?.a1c_at_goal || false,
      benzodiazepines: activityData.medical_checks?.benzodiazepines || false,
      antipsychotics: activityData.medical_checks?.antipsychotics || false,
      opioids: activityData.medical_checks?.opioids || false,
      fall_since_last_visit: activityData.medical_checks?.fall_since_last_visit || false
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

export interface ActivityFilters {
  site?: string;
  month?: number;
  year?: number;
  search?: string;
}

export const getActivities = async (filters?: ActivityFilters): Promise<Activity[]> => {
  try {
    // For now, we'll fetch all activities and filter on the frontend
    // This can be optimized later to use backend filtering
    const [activitiesResponse, patientsResponse] = await Promise.all([
      axios.get(`${API_URL}/activities`),
      axios.get(`${API_URL}/patients`)
    ]);
    
    let activities = activitiesResponse.data;
    const patients = patientsResponse.data;

    // Create a map of patient IDs to patient names
    const patientMap = new Map<number, string>(
      patients.map((patient: any) => [
        patient.id,
        `${patient.last_name}, ${patient.first_name}`
      ])
    );

    // Add patient names to activities, ensuring it's always a string
    activities = activities.map((activity: any) => {
      const patientName = patientMap.get(activity.patient_id);
      const activityWithName: Activity = {
        ...activity,
        patient_name: patientName || 'Unknown Patient'
      };
      return activityWithName;
    });

    // Apply filters if provided
    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        activities = activities.filter((activity: Activity) => 
          activity.patient_name.toLowerCase().includes(searchLower) ||
          String(activity.id).includes(filters.search!)
        );
      }
      
      if (filters.site) {
        activities = activities.filter((activity: Activity) => 
          activity.site_name === filters.site
        );
      }

      if (filters.month || filters.year) {
        activities = activities.filter((activity: Activity) => {
          if (!activity.service_datetime) return false;
          const activityDate = new Date(activity.service_datetime);
          const matchesMonth = !filters.month || activityDate.getMonth() + 1 === filters.month;
          const matchesYear = !filters.year || activityDate.getFullYear() === filters.year;
          return matchesMonth && matchesYear;
        });
      }
    }

    return activities;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
}; 