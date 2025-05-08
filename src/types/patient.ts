export interface Patient {
  firstName: string
  lastName: string
  birthDate: string
  gender: string
  siteName: string
  phoneNumber?: string
  contactName?: string
  contactPhoneNumber?: string
  insurance?: string
  isActivePatient: boolean
}

export interface Activity {
  activityId: string
  activityType: string
  initials: string
  isPharmacist: boolean
  recordDate: string
  totalTime: number
}

export interface PatientWithActivities {
  patient: Patient
  activities: Activity[]
} 