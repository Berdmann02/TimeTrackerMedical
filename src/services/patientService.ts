import axios from 'axios';
import { API_URL } from '../config';
import type { Patient as PatientType } from '../types/patient';
import { createMedicalRecord } from './medicalRecordService';

export type Patient = PatientType;

export interface Activity {
  id: number;
  patient_id: number;
  user_id: number;
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
  building_name?: string;
  site_start_time?: string;
  site_end_time?: string;
  personnel_start_time?: string;
  personnel_end_time?: string;
  activity_start_time?: string;
  activity_end_time?: string;
  notes_start_time?: string;
  notes_end_time?: string;
}

// Helper function to check if any medical status fields are being updated
const hasMedicalStatusChanges = (patientData: Partial<Patient>): boolean => {
  const medicalStatusFields = [
    'medical_records',
    'bp_at_goal',
    'hospital_visited_since_last_review',
    'a1c_at_goal',
    'use_benzo',
    'use_antipsychotic',
    'use_opioids',
    'fall_since_last_visit'
  ];

  return medicalStatusFields.some(field => field in patientData);
};

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

export const getPatientsBySiteId = async (siteId: number): Promise<Patient[]> => {
  try {
    const response = await axios.get(`${API_URL}/patients/site/${siteId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching patients for site ID ${siteId}:`, error);
    throw error;
  }
};

export interface CreatePatientDto {
  first_name: string;
  last_name: string;
  birthdate: string;
  gender: 'M' | 'F' | 'O';
  phone_number?: string;
  contact_name?: string;
  contact_phone_number?: string;
  insurance?: string;
  is_active: boolean;
  site_name: string; // site name
  building?: string; // building name
  notes?: string;
}

export const createPatient = async (patientData: CreatePatientDto): Promise<Patient> => {
  try {
    const response = await axios.post(`${API_URL}/patients`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

export const updatePatient = async (id: number | string, patientData: Partial<Patient>): Promise<Patient> => {
  try {
    // First update the patient - only send fields that the API expects
    const updateData: Partial<{
      first_name: string;
      last_name: string;
      birthdate: string | Date;
      gender: 'M' | 'F' | 'O';
      phone_number: string;
      contact_name: string;
      contact_phone_number: string;
      insurance: string;
      is_active: boolean;
      site_name: string;
      building: string; // building name
      notes: string;
    }> = {
      first_name: patientData.first_name,
      last_name: patientData.last_name,
      birthdate: patientData.birthdate,
      gender: patientData.gender,
      phone_number: patientData.phone_number,
      contact_name: patientData.contact_name,
      contact_phone_number: patientData.contact_phone_number,
      insurance: patientData.insurance,
      is_active: patientData.is_active,
      site_name: patientData.site_name,
      building: patientData.building,
      notes: patientData.notes
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    console.log('Sending update data to API:', updateData);
    const response = await axios.put(`${API_URL}/patients/${id}`, updateData);
    console.log('API response:', response.data);
    
    // If any medical status fields were updated, create a new medical record
    if (hasMedicalStatusChanges(patientData)) {
      await createMedicalRecord({
        patientId: typeof id === 'string' ? parseInt(id) : id,
        medical_records: patientData.medical_records ?? false,
        bpAtGoal: patientData.bp_at_goal ?? false,
        hospitalVisitSinceLastReview: patientData.hospital_visited_since_last_review ?? false,
        a1cAtGoal: patientData.a1c_at_goal ?? false,
        benzodiazepines: patientData.use_benzo ?? false,
        antipsychotics: patientData.use_antipsychotic ?? false,
        opioids: patientData.use_opioids ?? false,
        fallSinceLastVisit: patientData.fall_since_last_visit ?? false
      });
    }

    return response.data;
  } catch (error) {
    console.error(`Error updating patient with ID ${id}:`, error);
    throw error;
  }
};

export const deletePatient = async (id: number | string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/patients/${id}`);
  } catch (error) {
    console.error(`Error deleting patient with ID ${id}:`, error);
    throw error;
  }
};

