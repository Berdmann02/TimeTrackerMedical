import axios from 'axios';

const API_URL = 'https://time-tracker-medical-backend.onrender.com';

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  birthdate: string;
  gender: string;
  phone_number: string | null;
  contact_name: string | null;
  contact_phone_number: string | null;
  insurance: string | null;
  is_active: boolean;
  site_name: string;
  created_at: string;
  medical_records_completed?: boolean;
  bp_at_goal?: boolean;
  hospital_visited_since_last_review?: boolean;
  a1c_at_goal?: boolean;
  use_benzo?: boolean;
  fall_since_last_visit?: boolean;
  use_antipsychotic?: boolean;
  use_opioids?: boolean;
}

export interface Activity {
  id: number;
  patient_id: number;
  activity_type: string;
  user_initials?: string;
  personnel_initials?: string;
  is_pharmacist?: boolean;
  pharm_flag?: boolean;
  time_spent?: number;
  duration_minutes?: number;
  created_at?: string;
  service_datetime?: string;
  end_time?: string;
  notes?: string;
  site_name?: string;
  building?: string;
  site_start_time?: string;
  site_end_time?: string;
  personnel_start_time?: string;
  personnel_end_time?: string;
  activity_start_time?: string;
  activity_end_time?: string;
  notes_start_time?: string;
  notes_end_time?: string;
}

export interface CreatePatientDTO {
  first_name: string;
  last_name: string;
  birthdate: string;
  gender: string;
  site_name: string;
  is_active: boolean;
  phone_number?: string;
  contact_name?: string;
  contact_phone_number?: string;
  insurance?: string;
}

export const getPatients = async (): Promise<Patient[]> => {
  try {
    const response = await axios.get(`${API_URL}/patients`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

export const getPatientById = async (id: number | string): Promise<Patient> => {
  try {
    const response = await axios.get(`${API_URL}/patients/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching patient with ID ${id}:`, error);
    throw error;
  }
};

export const getPatientActivities = async (patientId: number | string): Promise<Activity[]> => {
  try {
    const response = await axios.get(`${API_URL}/activities/patient/${patientId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching activities for patient with ID ${patientId}:`, error);
    throw error;
  }
};

export const createPatient = async (patientData: CreatePatientDTO): Promise<Patient> => {
  try {
    const response = await axios.post(`${API_URL}/patients`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
}; 