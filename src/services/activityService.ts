import axios from 'axios';
import { API_URL } from '../config';
import { createMedicalRecord } from './medicalRecordService';

// Activity interface matching the backend schema
export interface Activity {
  id?: number;
  patient_id: number;
  user_id: number;
  activity_type: string;
  pharm_flag?: boolean;
  notes?: string;
  site_name: string;
  building?: string;
  service_datetime: Date | string;
  duration_minutes: number;
  created_at?: Date | string;
  user_initials?: string; // Added to match backend enriched data
}

// DTO for creating activities with medical checks
export interface CreateActivityDTO {
  patient_id: number;
  user_id: number;
  activity_type: string;
  duration_minutes: number;
  site_name: string;
  building?: string;
  notes?: string;
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

// Helper function to check if any medical checks are selected
const hasMedicalChecks = (medical_checks?: CreateActivityDTO['medical_checks']): boolean => {
  if (!medical_checks) return false;
  
  return Object.values(medical_checks).some(check => check === true);
};

// Get all activities - now returns enriched data from backend
export const getActivities = async (): Promise<Activity[]> => {
  try {
    const response = await axios.get(`${API_URL}/activities`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

// Get activity by ID
export const getActivityById = async (id: number | string): Promise<Activity> => {
  try {
    const response = await axios.get(`${API_URL}/activities/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching activity with ID ${id}:`, error);
    throw error;
  }
};

// Get activities by patient ID - now returns enriched data from backend
export const getActivitiesByPatientId = async (patientId: number | string): Promise<Activity[]> => {
  try {
    const response = await axios.get(`${API_URL}/activities/patient/${patientId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching activities for patient ${patientId}:`, error);
    throw error;
  }
};

// Get activities with details - now just uses the enriched data from backend
export const getActivitiesWithDetails = async (): Promise<Activity[]> => {
  try {
    return await getActivities();
  } catch (error) {
    console.error('Error fetching activities with details:', error);
    throw error;
  }
};

// Create activity with proper medical checks handling
export const createActivity = async (activityData: CreateActivityDTO): Promise<Activity> => {
  try {
    // Check if any medical checks are selected to set pharm_flag
    const hasChecks = hasMedicalChecks(activityData.medical_checks);
    
    // Map to backend schema
    const backendActivityData: Omit<Activity, 'id' | 'created_at'> = {
      patient_id: activityData.patient_id,
      user_id: activityData.user_id,
      activity_type: activityData.activity_type,
      pharm_flag: hasChecks, // Set pharm_flag based on medical checks
      notes: activityData.notes || '',
      site_name: activityData.site_name,
      building: activityData.building || '',
      service_datetime: new Date().toISOString(),
      duration_minutes: Math.max(1, Math.round(activityData.duration_minutes)) // Round to integer, minimum 1 minute
    };
    
    console.log('Creating activity with data:', backendActivityData);
    console.log('Raw input data:', activityData);
    console.log('Has medical checks:', hasChecks);
    const response = await axios.post(`${API_URL}/activities`, backendActivityData);
    const createdActivity = response.data;
    
    // If medical checks were performed, create a medical record
    if (hasChecks && activityData.medical_checks) {
      try {
        await createMedicalRecord({
          patientId: activityData.patient_id,
          medical_records: activityData.medical_checks.medical_records,
          bpAtGoal: activityData.medical_checks.bp_at_goal,
          hospitalVisitSinceLastReview: activityData.medical_checks.hospital_visit,
          a1cAtGoal: activityData.medical_checks.a1c_at_goal,
          benzodiazepines: activityData.medical_checks.benzodiazepines,
          antipsychotics: activityData.medical_checks.antipsychotics,
          opioids: activityData.medical_checks.opioids,
          fallSinceLastVisit: activityData.medical_checks.fall_since_last_visit
        });
        console.log('Medical record created for activity');
      } catch (medicalRecordError) {
        console.error('Error creating medical record:', medicalRecordError);
        // Don't fail the activity creation if medical record fails
      }
    }
    
    return createdActivity;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

// Update activity
export const updateActivity = async (id: number | string, activityData: Partial<Activity>): Promise<Activity> => {
  try {
    const response = await axios.put(`${API_URL}/activities/${id}`, activityData);
    return response.data;
  } catch (error) {
    console.error(`Error updating activity with ID ${id}:`, error);
    throw error;
  }
};

// Delete activity
export const deleteActivity = async (id: number | string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/activities/${id}`);
  } catch (error) {
    console.error(`Error deleting activity with ID ${id}:`, error);
    throw error;
  }
};

// Get available activity types
export const getActivityTypes = async (): Promise<string[]> => {
  try {
    // Return predefined activity types
    // This can be replaced with an API call when backend endpoint is available
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