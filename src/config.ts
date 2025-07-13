// API Configuration
// In development, use local backend if VITE_API_URL is not set
// In production, always use the production backend
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000' : 'https://time-tracker-medical-backend-production.up.railway.app'); 