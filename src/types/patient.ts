export interface Patient {
  firstName: string
  lastName: string
  birthDate: string
  gender: string
  siteName: string
  building?: string
  phoneNumber?: string
  contactName?: string
  contactPhoneNumber?: string
  insurance?: string
  isActivePatient: boolean
  medicalRecordsCompleted?: boolean
  bpAtGoal?: boolean
  hospitalVisitedSinceLastReview?: boolean
  a1cAtGoal?: boolean
  useBenzo?: boolean
  fallSinceLastVisit?: boolean
  useAntipsychotic?: boolean
  useOpioids?: boolean
}

export interface Activity {
  activityId: string
  activityType: string
  initials: string
  recordDate: string
  totalTime: number
  time_spent?: number
  duration_minutes?: number
}

export interface PatientWithActivities {
  patient: Patient
  activities: Activity[]
} 