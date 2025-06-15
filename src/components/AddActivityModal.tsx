import React, { useState, useEffect, useRef } from "react";
import {
  FaHospital,
  FaClipboardList,
  FaClock,
  FaStickyNote,
  FaPlay,
  FaStop,
} from "react-icons/fa";
import { getPatients } from "../services/patientService";
import type { Patient } from "../services/patientService";
import { createActivity, getActivityTypes } from "../services/activityService";
import type { CreateActivityDTO } from "../services/activityService";
import { X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useInactivityContext } from '../components/layout/InactivityLogoutProvider';

interface ActivityForm {
  patientId: string;
  activityType: string;
  startTime: string;
  service_endtime: string;
  notes: string;
  medicalChecks: {
    medicalRecords: boolean;
    bpAtGoal: boolean;
    hospitalVisit: boolean;
    a1cAtGoal: boolean;
    benzodiazepines: boolean;
    antipsychotics: boolean;
    opioids: boolean;
    fallSinceLastVisit: boolean;
  };
}

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityAdded?: () => void;
  patientId?: string;
  patientName?: string;
  siteName?: string;
  // Optional patients list to avoid loading
  patients?: Patient[];
}

const AddActivityModal: React.FC<AddActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  onActivityAdded,
  patientId: initialPatientId,
  patientName,
  siteName,
  patients: providedPatients = [] 
}) => {
  const { user, isPharmacist, isAdmin } = useAuth();
  const { setIsModalOpen } = useInactivityContext();
  
  const [patients, setPatients] = useState<Patient[]>(providedPatients);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(providedPatients.length === 0);
  const prevIsOpen = useRef(isOpen);
  
  const [formData, setFormData] = useState<ActivityForm>({
    patientId: initialPatientId || "",
    activityType: "",
    startTime: "",
    service_endtime: "",
    notes: "",
    medicalChecks: {
      medicalRecords: false,
      bpAtGoal: false,
      hospitalVisit: false,
      a1cAtGoal: false,
      benzodiazepines: false,
      antipsychotics: false,
      opioids: false,
      fallSinceLastVisit: false
    }
  });

  const [dateErrors, setDateErrors] = useState({
    startTime: "",
    service_endtime: ""
  });

  // Helper function to compare dates without time
  const compareDates = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Helper function to get error message based on date/time comparison
  const getErrorMessage = (start: Date, end: Date): string => {
    // Compare dates without time
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    if (endDate < startDate) {
      return "End date cannot be earlier than start date";
    } else if (endDate > startDate) {
      return "Start date cannot be later than end date";
    } else {
      // Same date, compare times
      if (end < start) {
        return "End time cannot be earlier than start time";
      } else {
        return "Start time cannot be later than end time";
      }
    }
  };

  // Add helper function to get max date in local datetime-local format
  const getMaxDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to validate if a date is in the future
  const isFutureDate = (dateString: string): boolean => {
    const inputDate = new Date(dateString);
    const today = new Date();
    
    return (
      inputDate.getFullYear() > today.getFullYear() ||
      (inputDate.getFullYear() === today.getFullYear() &&
        inputDate.getMonth() > today.getMonth()) ||
      (inputDate.getFullYear() === today.getFullYear() &&
        inputDate.getMonth() === today.getMonth() &&
        inputDate.getDate() > today.getDate())
    );
  };

  const [isTracking, setIsTracking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasStopped, setHasStopped] = useState(false);

  // Create initial form state function
  const getInitialFormState = (): ActivityForm => ({
    patientId: initialPatientId || "",
    activityType: "",
    startTime: "",
    service_endtime: "",
    notes: "",
    medicalChecks: {
      medicalRecords: false,
      bpAtGoal: false,
      hospitalVisit: false,
      a1cAtGoal: false,
      benzodiazepines: false,
      antipsychotics: false,
      opioids: false,
      fallSinceLastVisit: false
    }
  });

  // Update inactivity context when modal opens/closes
  useEffect(() => {
    setIsModalOpen(isOpen);
    return () => setIsModalOpen(false);
  }, [isOpen, setIsModalOpen]);

  // Update patients state when providedPatients changes
  useEffect(() => {
    if (providedPatients.length > 0) {
      setPatients(providedPatients);
      setIsLoadingData(false);
    }
  }, [providedPatients]);

  // Load initial data when modal opens and reset form when modal closes
  useEffect(() => {
    // If modal was open and is now closed, reset the form
    if (prevIsOpen.current && !isOpen) {
      setFormData(getInitialFormState());
      setIsTracking(false);
      setHasStarted(false);
      setHasStopped(false);
      setError(null);
      setIsSubmitting(false);
      setDateErrors({ startTime: "", service_endtime: "" }); // Clear date errors
    }
    // If modal is opened, load initial data and reset form
    if (isOpen && !prevIsOpen.current) {
      setFormData(getInitialFormState());
      setIsTracking(false);
      setHasStarted(false);
      setHasStopped(false);
      setError(null);
      setIsSubmitting(false);
      loadInitialData();
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, initialPatientId]);

  // Additional useEffect to reset form when initialPatientId changes while modal is open
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState());
      setIsTracking(false);
      setHasStarted(false);
      setHasStopped(false);
      setError(null);
      setDateErrors({ startTime: "", service_endtime: "" }); // Clear date errors
    }
  }, [initialPatientId]);

  const loadInitialData = async () => {
    setIsLoadingData(true);
    setError(null);
    
    try {
      const [activityTypesData, patientsData] = await Promise.all([
        getActivityTypes(),
        providedPatients.length > 0 ? Promise.resolve(providedPatients) : getPatients()
      ]);
      
      setActivityTypes(activityTypesData);
      if (providedPatients.length === 0) {
        setPatients(patientsData);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("Failed to load required data. Please try again.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Lock/unlock body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    
    // Special handling for datetime-local inputs
    if (name === 'startTime' || name === 'service_endtime') {
      if (value) {
        // Check if the selected date is in the future
        if (isFutureDate(value)) {
          return; // Don't update the state if it's a future date
        }

        // Convert the local datetime to a Date object and then to ISO string
        const date = createLocalDate(value);
        const newTime = date.toISOString();

        // Create temp form data to check validation
        const tempFormData = {
          ...formData,
          [name]: newTime
        };

        // Validate dates
        let newDateErrors = { ...dateErrors };
        
        if (name === 'startTime' && tempFormData.service_endtime) {
          const startDate = new Date(newTime);
          const endDate = new Date(tempFormData.service_endtime);
          
          if (startDate > endDate) {
            newDateErrors.startTime = getErrorMessage(startDate, endDate);
          } else {
            newDateErrors.startTime = "";
            newDateErrors.service_endtime = ""; // Clear end time error if start time is valid
          }
        } else if (name === 'service_endtime' && tempFormData.startTime) {
          const startDate = new Date(tempFormData.startTime);
          const endDate = new Date(newTime);
          
          if (endDate < startDate) {
            newDateErrors.service_endtime = getErrorMessage(startDate, endDate);
          } else {
            newDateErrors.service_endtime = "";
            newDateErrors.startTime = ""; // Clear start time error if end time is valid
          }
        }

        setDateErrors(newDateErrors);
        
        setFormData(prev => ({
          ...prev,
          [name]: newTime
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: ""
        }));
        // Clear errors when field is emptied
        setDateErrors(prev => ({
          ...prev,
          [name]: ""
        }));
      }
    } else {
      // Default handling for other inputs
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleStartTime = () => {
    const now = new Date();
    const isoString = now.toISOString();
    // Allow restarting even after stopping (having an end time)
    setFormData((prev) => ({ ...prev, startTime: isoString, service_endtime: "" }));
    setIsTracking(true);
    setHasStarted(true);
    setHasStopped(false);
  };

  const handleEndTime = () => {
    // Only set endTime if we're currently tracking
    if (isTracking) {
      const now = new Date();
      const isoString = now.toISOString();
      setFormData((prev) => ({ ...prev, service_endtime: isoString }));
      setIsTracking(false);
      setHasStopped(true);
    }
  };

  const calculateTimeDifference = (): number => {
    if (!formData.startTime || !formData.service_endtime) return 0;
    
    try {
      const start = new Date(formData.startTime).getTime();
      const end = new Date(formData.service_endtime).getTime();
      
      // Calculate difference in milliseconds, then convert to minutes
      const diffMs = end - start;
      const diffMinutes = diffMs / (1000 * 60);
      
      // Debug logging to help track time calculations
      console.log('Time calculation:', {
        startTime: formData.startTime,
        service_endtime: formData.service_endtime,
        startDate: new Date(formData.startTime).toLocaleString(),
        endDate: new Date(formData.service_endtime).toLocaleString(),
        diffMinutes: diffMinutes.toFixed(2)
      });
      
      return Math.max(0, diffMinutes);
    } catch (error) {
      console.error('Error calculating time difference:', error);
      return 0;
    }
  };

  // Add useEffect to log when form data changes (for debugging)
  useEffect(() => {
    if (formData.startTime && formData.service_endtime) {
      console.log('Form data changed - recalculating time:', {
        start: new Date(formData.startTime).toLocaleString(),
        end: new Date(formData.service_endtime).toLocaleString(),
        difference: calculateTimeDifference()
      });
    }
  }, [formData.startTime, formData.service_endtime]);

  const formatTimeDifference = (): string => {
    const totalMinutes = calculateTimeDifference();
    if (totalMinutes === 0) return "0.00 minutes";
    
    // If less than 1 minute, show as decimal minutes (seconds converted to decimal)
    if (totalMinutes < 1) {
      const decimalMinutes = Math.round(totalMinutes * 100) / 100;
      return `${decimalMinutes.toFixed(2)} minutes`;
    }
    
    // If less than 60 minutes, show as decimal minutes
    if (totalMinutes < 60) {
      const decimalMinutes = Math.round(totalMinutes * 100) / 100;
      return `${decimalMinutes.toFixed(2)} minutes`;
    }
    
    // If 60 minutes or more, show as decimal hours
    const decimalHours = Math.round((totalMinutes / 60) * 100) / 100;
    return `${decimalHours.toFixed(2)} hours`;
  };

  // Helper function to format ISO string to datetime-local format
  const formatDateTimeLocal = (isoString: string): string => {
    if (!isoString) return "";
    
    try {
      // Create a date object from the ISO string
      const date = new Date(isoString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return "";
      
      // Get the local date components
      const YYYY = date.getFullYear();
      const MM = String(date.getMonth() + 1).padStart(2, '0');
      const DD = String(date.getDate()).padStart(2, '0');
      const HH = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      
      // Format as YYYY-MM-DDTHH:mm
      return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return "";
    }
  };

  // Helper function to create a date from datetime-local input
  const createLocalDate = (datetimeLocalValue: string): Date => {
    try {
      // Parse the datetime-local value (YYYY-MM-DDTHH:mm)
      const [datePart, timePart] = datetimeLocalValue.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Create date object using local components
      const date = new Date();
      date.setFullYear(year);
      date.setMonth(month - 1); // Months are 0-based
      date.setDate(day);
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(0);
      date.setMilliseconds(0);
      
      return date;
    } catch (error) {
      console.error('Error creating local date:', error);
      return new Date(); // Return current date as fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for date validation errors
    if (dateErrors.startTime || dateErrors.service_endtime) {
      // Don't set error state, just return to prevent submission
      return;
    }

    // Clear any previous errors and start submission
    setError(null);
    setIsSubmitting(true);

    try {
      // Calculate duration in minutes from the stored end time
      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.service_endtime);
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

      // Create activity data
      const activityData: CreateActivityDTO = {
        patient_id: parseInt(formData.patientId),
        user_id: user?.id || 0,
        activity_type: formData.activityType,
        service_datetime: formData.startTime,
        service_endtime: formData.service_endtime,
        duration_minutes: durationMinutes,
        site_name: siteName || '',
        building: '',
        notes: formData.notes,
        medical_checks: {
          medical_records: formData.medicalChecks.medicalRecords,
          bp_at_goal: formData.medicalChecks.bpAtGoal,
          hospital_visit: formData.medicalChecks.hospitalVisit,
          a1c_at_goal: formData.medicalChecks.a1cAtGoal,
          benzodiazepines: formData.medicalChecks.benzodiazepines,
          antipsychotics: formData.medicalChecks.antipsychotics,
          opioids: formData.medicalChecks.opioids,
          fall_since_last_visit: formData.medicalChecks.fallSinceLastVisit
        }
      };

      await createActivity(activityData);
      onClose();
      if (onActivityAdded) {
        onActivityAdded();
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      setError('Failed to create activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Find selected patient details
  const selectedPatient = patients.find(p => p.id?.toString() === formData.patientId);
  const selectedPatientName = selectedPatient 
    ? `${selectedPatient.last_name}, ${selectedPatient.first_name}`
    : patientName && initialPatientId === formData.patientId ? patientName : "";

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-4"
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Activity</h2>
              <p className="mt-1 text-sm text-gray-600">
                Please fill in all the required information to track an activity.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {isLoadingData ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-4 text-5xl">!</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient and Activity Type Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Patient Selection - Only show dropdown if no patientId is provided, otherwise show locked field */}
                {initialPatientId ? (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center">
                        <FaHospital className="w-4 h-4 text-gray-400 mr-2" />
                        Patient
                      </span>
                    </label>
                    <input
                      type="text"
                      value={selectedPatientName || patientName || ''}
                      disabled
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-100 rounded-lg shadow-sm cursor-not-allowed text-gray-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center">
                        <FaHospital className="w-4 h-4 text-gray-400 mr-2" />
                        Patient
                      </span>
                    </label>
                    <select
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleInputChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                      required
                    >
                      <option value="">Select Patient</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.last_name}, {patient.first_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Activity Type */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <FaClipboardList className="w-4 h-4 text-gray-400 mr-2" />
                      Activity Type
                    </span>
                  </label>
                  <select
                    name="activityType"
                    value={formData.activityType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                    required
                  >
                    <option value="">Select Activity Type</option>
                    {activityTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Medical Checklist - Only show for pharmacists and admins */}
              {(isPharmacist || isAdmin) && (
                <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <FaClipboardList className="w-5 h-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Medical Checklist
                      </h3>
                    </div>
                    <span className="text-sm font-normal text-gray-500">* leave blank if not applicable</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <label className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            name="medicalChecks.medicalRecords"
                            checked={formData.medicalChecks.medicalRecords}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                medicalChecks: {
                                  ...prev.medicalChecks,
                                  medicalRecords: e.target.checked
                                }
                              }));
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <span className="text-gray-700">Medical Records</span>
                        </div>
                      </label>

                      <label className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            name="medicalChecks.bpAtGoal"
                            checked={formData.medicalChecks.bpAtGoal}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                medicalChecks: {
                                  ...prev.medicalChecks,
                                  bpAtGoal: e.target.checked
                                }
                              }));
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <span className="text-gray-700">BP at Goal</span>
                        </div>
                      </label>

                      <label className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            name="medicalChecks.hospitalVisit"
                            checked={formData.medicalChecks.hospitalVisit}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                medicalChecks: {
                                  ...prev.medicalChecks,
                                  hospitalVisit: e.target.checked
                                }
                              }));
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <span className="text-gray-700">Hospital Visit Since Last Review</span>
                        </div>
                      </label>

                      <label className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            name="medicalChecks.a1cAtGoal"
                            checked={formData.medicalChecks.a1cAtGoal}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                medicalChecks: {
                                  ...prev.medicalChecks,
                                  a1cAtGoal: e.target.checked
                                }
                              }));
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <span className="text-gray-700">A1C at Goal</span>
                        </div>
                      </label>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <label className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            name="medicalChecks.benzodiazepines"
                            checked={formData.medicalChecks.benzodiazepines}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                medicalChecks: {
                                  ...prev.medicalChecks,
                                  benzodiazepines: e.target.checked
                                }
                              }));
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <span className="text-gray-700">Benzodiazepines</span>
                        </div>
                      </label>

                      <label className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            name="medicalChecks.antipsychotics"
                            checked={formData.medicalChecks.antipsychotics}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                medicalChecks: {
                                  ...prev.medicalChecks,
                                  antipsychotics: e.target.checked
                                }
                              }));
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <span className="text-gray-700">Antipsychotics</span>
                        </div>
                      </label>

                      <label className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            name="medicalChecks.opioids"
                            checked={formData.medicalChecks.opioids}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                medicalChecks: {
                                  ...prev.medicalChecks,
                                  opioids: e.target.checked
                                }
                              }));
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <span className="text-gray-700">Opioids</span>
                        </div>
                      </label>

                      <label className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            name="medicalChecks.fallSinceLastVisit"
                            checked={formData.medicalChecks.fallSinceLastVisit}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                medicalChecks: {
                                  ...prev.medicalChecks,
                                  fallSinceLastVisit: e.target.checked
                                }
                              }));
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <span className="text-gray-700">Fall Since Last Visit</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Tracking */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <FaClock className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Time Tracking
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Start Time Section */}
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <button
                        type="button"
                        onClick={handleStartTime}
                        disabled={hasStarted}
                        className={`inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer ${
                          hasStarted
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        }`}
                      >
                        <FaPlay className="w-4 h-4 mr-2" />
                        {hasStarted ? "Started" : "Start Time"}
                      </button>
                    </div>
                    
                    {/* Manual Start Date/Time Input */}
                    {formData.startTime && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Start Date & Time
                        </label>
                        <div className="space-y-1">
                          <input
                            type="datetime-local"
                            name="startTime"
                            value={formatDateTimeLocal(formData.startTime)}
                            onChange={handleInputChange}
                            max={`${getMaxDate()}T23:59`}
                            className={`mt-1 block w-full px-3 py-2 text-base border ${
                              dateErrors.startTime 
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            } bg-gray-50 focus:outline-none focus:ring-1 rounded-lg shadow-sm transition-colors`}
                          />
                          {dateErrors.startTime && (
                            <p className="text-sm text-red-600 mt-1">
                              {dateErrors.startTime}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* End Time Section */}
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <button
                        type="button"
                        onClick={handleEndTime}
                        disabled={!hasStarted || hasStopped}
                        className={`inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer ${
                          !hasStarted || hasStopped
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                        }`}
                      >
                        <FaStop className="w-4 h-4 mr-2" />
                        {hasStopped ? "Stopped" : "Stop Time"}
                      </button>
                    </div>
                    
                    {/* Manual End Date/Time Input */}
                    {formData.service_endtime && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          End Date & Time
                        </label>
                        <div className="space-y-1">
                          <input
                            type="datetime-local"
                            name="service_endtime"
                            value={formatDateTimeLocal(formData.service_endtime)}
                            onChange={handleInputChange}
                            max={`${getMaxDate()}T23:59`}
                            className={`mt-1 block w-full px-3 py-2 text-base border ${
                              dateErrors.service_endtime 
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            } bg-gray-50 focus:outline-none focus:ring-1 rounded-lg shadow-sm transition-colors`}
                          />
                          {dateErrors.service_endtime && (
                            <p className="text-sm text-red-600 mt-1">
                              {dateErrors.service_endtime}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Total Time Display */}
                {formData.startTime && formData.service_endtime && (
                  <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      Total time: <span className="font-semibold">{formatTimeDifference()}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <FaStickyNote className="w-4 h-4 text-gray-400 mr-2" />
                    Additional Notes
                  </span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm resize-none hover:bg-gray-100 transition-colors"
                  placeholder="Add any relevant details or observations..."
                />
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving..." : "Save Activity"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddActivityModal;