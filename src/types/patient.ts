export interface CreatePatientDto {
    first_name: string;
    last_name: string;
    birthdate: string; // format: 'YYYY-MM-DD'
    gender: 'M' | 'F' | 'O';
    phone_number?: string;
    contact_name?: string;
    contact_phone_number?: string;
    insurance?: string;
    site_name: string; // Site name
    building?: string; // Building ID
    is_active: boolean;
    notes?: string; // Add notes field
}

export interface Patient {
    id?: number;
    first_name: string;
    last_name: string;
    birthdate: string;
    gender: 'M' | 'F' | 'O';
    phone_number?: string;
    contact_name?: string;
    contact_phone_number?: string;
    insurance?: string;
    is_active: boolean;
    site_name: string; // Site name
    building?: string; // Building ID
    created_at?: Date;
    medical_records?: boolean;
    notes?: string;
    // Medical status fields
    bp_at_goal?: boolean;
    hospital_visited_since_last_review?: boolean;
    a1c_at_goal?: boolean;
    use_benzo?: boolean;
    use_antipsychotic?: boolean;
    use_opioids?: boolean;
    fall_since_last_visit?: boolean;
}

export interface Activity {
  activityId: string
  activityType: string
  initials: string
  recordDate: string
  totalTime: number
  time_spent?: number
  duration_minutes?: number // Supports decimal values to account for seconds (e.g., 1.5 minutes = 1 minute 30 seconds)
}

export interface PatientActivity {
    activityId: string;
    activityType: string;
    initials: string;
    recordDate: string;
    totalTime: number;
    time_spent?: number;
    duration_minutes?: number // Supports decimal values to account for seconds (e.g., 1.5 minutes = 1 minute 30 seconds)
}

export interface PatientWithActivities {
    patient: Patient;
    activities: PatientActivity[];
} 