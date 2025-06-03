import axios from 'axios';
import { API_URL } from '../config';

export interface MedicalRecord {
  id?: number;
  patientId: number;
  medical_records: boolean;
  bpAtGoal: boolean;
  hospitalVisitSinceLastReview: boolean;
  a1cAtGoal: boolean;
  benzodiazepines: boolean;
  antipsychotics: boolean;
  opioids: boolean;
  fallSinceLastVisit: boolean;
  createdAt?: Date;
}

export const createMedicalRecord = async (medicalRecordData: Omit<MedicalRecord, 'id' | 'createdAt'>): Promise<MedicalRecord> => {
  try {
    const response = await axios.post(`${API_URL}/medical-records`, medicalRecordData);
    return response.data;
  } catch (error) {
    console.error('Error creating medical record:', error);
    throw error;
  }
};

export const getMedicalRecordsByPatientId = async (patientId: number | string): Promise<MedicalRecord[]> => {
  try {
    const response = await axios.get(`${API_URL}/medical-records/patient/${patientId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching medical records for patient with ID ${patientId}:`, error);
    throw error;
  }
};

export const getLatestMedicalRecordByPatientId = async (patientId: number | string): Promise<MedicalRecord | null> => {
  try {
    const response = await axios.get(`${API_URL}/medical-records/patient/${patientId}/latest`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching latest medical record for patient with ID ${patientId}:`, error);
    throw error;
  }
}; 