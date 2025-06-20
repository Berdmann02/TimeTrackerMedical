import { useState, useEffect, memo, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { User, Activity as ActivityIcon, Plus, ChevronLeft, Pencil, ClipboardCheck, Heart, Hospital, FileText, Pill, AlertTriangle, Syringe, Save, X, ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, Clock, Trash } from "lucide-react"
import { 
  getPatientById, 
  updatePatient, 
  deletePatient,
  type Patient
} from "../../services/patientService"
import { getActivitiesByPatientId, type Activity as ServiceActivity } from '../../services/activityService'
import { getSitesAndBuildings, type SiteWithBuildings } from "../../services/siteService"
import { getLatestMedicalRecordByPatientId, type MedicalRecord } from "../../services/medicalRecordService"
import AddActivityModal from "../../components/AddActivityModal"
import StatusHistoryModal from "../../components/StatusHistoryModal"
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal"

// DetailRow component for editable fields that maintains original UI
interface DetailRowProps {
    icon?: any;
    label: string;
    value: string | number | boolean | Date | null | undefined;
    isEditing?: boolean;
    onEdit?: (value: any) => void;
    editType?: 'text' | 'date' | 'select' | 'checkbox' | 'readonly' | 'textarea';
    editOptions?: string[];
    className?: string;
    forceReadOnly?: boolean;
}

// Add this before DetailRow component
const formatDateForInput = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const DetailRow: React.FC<DetailRowProps> = memo(({ 
  icon, 
  label, 
  value, 
  isEditing = false, 
  onEdit, 
  editType = 'text', 
  editOptions = [], 
  className = '',
  forceReadOnly = false
}) => {
  // Format value for display
  const formatValue = (val: DetailRowProps['value']): string => {
    if (val === null || val === undefined) return 'N/A';
    if (label === 'Birth Date' && (val instanceof Date || (typeof val === 'string' && val.includes('T')))) {
      return new Date(val).toLocaleDateString();
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  };

  const renderValue = () => {
    if (isEditing && !forceReadOnly) {
      switch (editType) {
        case 'date':
          return (
            <input
              type="date"
              value={formatDateForInput(value as string)}
              onChange={(e) => onEdit?.(e.target.value)}
              className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          );
        case 'select':
          return (
            <select
              value={String(value)}
              onChange={(e) => onEdit?.(e.target.value)}
              className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select {label}</option>
              {editOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        case 'checkbox':
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{label}</span>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onEdit?.(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          );
        case 'textarea':
          return (
            <textarea
              value={formatValue(value)}
              onChange={(e) => onEdit?.(e.target.value)}
              className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
          );
        default:
          return (
            <input
              type="text"
              value={formatValue(value)}
              onChange={(e) => onEdit?.(e.target.value)}
              className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          );
      }
    }

    return <span className="text-gray-900">{formatValue(value)}</span>;
  };

  if (editType === 'checkbox' && isEditing) {
    return renderValue();
  }

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-gray-500 mb-1">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </label>
      <div className="mt-1">
        {renderValue()}
      </div>
    </div>
  );
});

// Add this interface before LastUpdatedModalProps
interface StatusUpdate {
  field: string;
  activityId: string;
  updatedAt: string;
  updatedBy: string;
}

interface LastUpdatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  updates: StatusUpdate[];
}

const LastUpdatedModal: React.FC<LastUpdatedModalProps> = ({ isOpen, onClose, updates }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Clock className="h-6 w-6 mr-2" />
                Status Update History
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                View the history of updates to patient status fields and associated activities.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Updates List */}
          <div className="space-y-4">
            {updates.map((update, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{update.field}</h3>
                    <p className="text-sm text-gray-600 mt-1">Updated by {update.updatedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">Activity #{update.activityId}</p>
                    <p className="text-sm text-gray-500 mt-1">{update.updatedAt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format birthdate
const formatBirthdate = (birthdate: Date | string | undefined): string => {
  if (!birthdate) return '';
  return typeof birthdate === 'string' ? birthdate : birthdate.toISOString().split('T')[0];
};

type GenderCode = 'M' | 'F' | 'O';
type GenderDisplay = 'Male' | 'Female' | 'Other';

const genderOptions: Record<GenderCode, GenderDisplay> = {
  'M': 'Male',
  'F': 'Female',
  'O': 'Other'
};

const getGenderDisplay = (value: string | null | undefined): GenderDisplay | '' => {
  if (!value) return '';
  return genderOptions[value as GenderCode] || value as GenderDisplay;
};

const getGenderValue = (display: string): GenderCode => {
  const entry = Object.entries(genderOptions).find(([_, v]) => v === display);
  return (entry ? entry[0] : display) as GenderCode;
};

// Update the PatientActivity interface to match the display format
interface PatientActivity {
  activityId: string;
  activityType: string;
  initials: string;
  recordDate: string;
  totalTime: number;
  time_spent: number;
  duration_minutes: number;
}

// Local interface for patient data with activities
interface LocalPatientWithActivities {
  patient: Patient & { site_name: string };
  activities: PatientActivity[];
}

export default function PatientDetailsPage() {
  const navigate = useNavigate()
  const { patientId = '' } = useParams<{ patientId: string }>()
  const { isPharmacist, isNurse } = useAuth()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null)
  const [activities, setActivities] = useState<ServiceActivity[]>([])
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLastUpdatedModalOpen, setIsLastUpdatedModalOpen] = useState(false)
  const [sitesAndBuildings, setSitesAndBuildings] = useState<SiteWithBuildings[]>([])
  const [availableBuildings, setAvailableBuildings] = useState<string[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [latestMedicalRecord, setLatestMedicalRecord] = useState<MedicalRecord | null>(null);

  // Add new state variables for activity sorting and filtering
  const [activitySortField, setActivitySortField] = useState<"activityId" | "activityType" | "initials" | "recordDate" | "totalTime" | null>(null)
  const [activitySortDirection, setActivitySortDirection] = useState<"asc" | "desc">("asc")
  
  // Get current date for default filters
  const currentDate = new Date()
  const currentMonth = (currentDate.getMonth() + 1).toString() // getMonth() returns 0-11, so add 1
  const currentYear = currentDate.getFullYear().toString()

  // Get unique years from activities
  const activityYears = useMemo(() => {
    if (!activities) return [currentYear];
    
    const years = activities.map(activity => {
      const date = new Date(activity.service_datetime || activity.created_at || new Date());
      return date.getFullYear().toString();
    });
    
    return [...new Set(years)].sort((a, b) => Number(a) - Number(b)); // Sort ascending
  }, [activities]);

  const [activityMonthFilter, setActivityMonthFilter] = useState<string>(currentMonth)
  const [activityYearFilter, setActivityYearFilter] = useState<string>(currentYear)

  // Add months array for filters
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Add this mock data - would be replaced with real data later
  const statusUpdates: StatusUpdate[] = [
    {
      field: "BP at Goal",
      activityId: "12345",
      updatedAt: "2024-03-15",
      updatedBy: "Dr. Smith"
    },
    {
      field: "Medical Records",
      activityId: "12346",
      updatedAt: "2024-03-14",
      updatedBy: "Nurse Johnson"
    },
    {
      field: "Fall Since Last Visit",
      activityId: "12347",
      updatedAt: "2024-03-13",
      updatedBy: "Dr. Brown"
    }
  ];

  // Fetch patient data and activities
  const fetchPatientData = async () => {
    if (!patientId) {
      setError("No patient ID provided");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, try to get the patient details
      const patientData = await getPatientById(patientId);
      console.log('Fetched patient data:', patientData);

      // Fetch the latest medical record and merge its fields into the patient object
      try {
        const latestRecord = await getLatestMedicalRecordByPatientId(patientId);
        setLatestMedicalRecord(latestRecord);
        if (latestRecord) {
          patientData.medical_records = latestRecord.medical_records;
          patientData.bp_at_goal = latestRecord.bpAtGoal;
          patientData.hospital_visited_since_last_review = latestRecord.hospitalVisitSinceLastReview;
          patientData.a1c_at_goal = latestRecord.a1cAtGoal;
          patientData.use_benzo = latestRecord.benzodiazepines;
          patientData.use_antipsychotic = latestRecord.antipsychotics;
          patientData.use_opioids = latestRecord.opioids;
          patientData.fall_since_last_visit = latestRecord.fallSinceLastVisit;
        }
      } catch (medicalRecordError) {
        console.error("Error fetching latest medical record:", medicalRecordError);
      }

      setPatient(patientData);

      // Get activities with enriched data
      try {
        const activitiesData = await getActivitiesByPatientId(patientId);
        setActivities(activitiesData);
      } catch (activityError) {
        console.error("Error fetching patient activities:", activityError);
        setActivities([]);
      }
    } catch (err) {
      console.error("Error fetching patient data:", err);
      setError("Failed to load patient data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData()
  }, [patientId])

  // Only fetch sites and buildings when editing mode is activated
  useEffect(() => {
    const fetchSitesAndBuildings = async () => {
      if (!isEditing) return;
      
      try {
        const data = await getSitesAndBuildings();
        console.log('Fetched sites and buildings:', data);
        setSitesAndBuildings(data);
        
        // If we have a site selected, set its buildings
        if (editedPatient?.site_name) {
          console.log('Current site name:', editedPatient.site_name);
          const selectedSite = data.find(site => site.site_name === editedPatient.site_name);
          console.log('Selected site:', selectedSite);
          if (selectedSite) {
            console.log('Setting available buildings:', selectedSite.building_names);
            setAvailableBuildings(selectedSite.building_names);
          }
        }
      } catch (err) {
        console.error("Error fetching sites and buildings:", err);
      }
    };

    fetchSitesAndBuildings();
  }, [isEditing, editedPatient?.site_name]);

  // Convert API data to format expected by the component
  const patientData: LocalPatientWithActivities | null = patient ? {
    patient: {
      ...patient,
      site_name: patient.site_name || '', // Ensure site is provided as it's required
    },
    activities: activities.map(activity => ({
      activityId: activity.id?.toString() || '',
      activityType: activity.activity_type || '',
      initials: activity.user_initials || 'N/A',
      recordDate: (activity.service_datetime || activity.created_at || new Date().toISOString()).toString(),
      totalTime: activity.duration_minutes,
      time_spent: activity.duration_minutes,
      duration_minutes: activity.duration_minutes
    }))
  } : null

  const handleActivityClick = (activityId: string) => {
    navigate(`/activity/${activityId}`)
  }

  const handleAddActivity = () => {
    setIsAddActivityModalOpen(true);
  }

  const handleActivityAdded = () => {
    // Refresh patient data to include new activity
    if (patientId) {
      fetchPatientData();
    }
  };

  // Update the formatTimeSpent function to accept PatientActivity
  const formatTimeSpent = (activity: PatientActivity): string => {
    const timeSpent = activity.time_spent;
    const durationMinutes = activity.duration_minutes;
    
    let totalMinutes = 0;
    
    if (timeSpent !== undefined && timeSpent !== null && !isNaN(Number(timeSpent))) {
      totalMinutes = Number(timeSpent);
    } else if (durationMinutes !== undefined && durationMinutes !== null && !isNaN(Number(durationMinutes))) {
      totalMinutes = Number(durationMinutes);
    } else {
      return 'N/A';
    }
    
    if (totalMinutes === 0) return "0:00";
    
    // Convert total minutes to total seconds for precise calculation
    const totalSeconds = Math.round(totalMinutes * 60);
    
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // Format like a stopwatch
    if (hours > 0) {
      // Show H:MM:SS for durations over 1 hour
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      // Show MM:SS for durations under 1 hour
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const handleEditPatient = () => {
    setIsEditing(true);
    // Create a deep copy of the patient data to avoid reference issues
    setEditedPatient(patient ? {...patient} : null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPatient(patient);
  };

  const handleSave = async () => {
    if (!editedPatient || !patientId) return;
    
    setIsSaving(true);
    try {
      console.log('Saving patient with data:', editedPatient);
      const updatedPatient = await updatePatient(patientId, editedPatient);
      console.log('Patient updated successfully:', updatedPatient);
      
      // Re-fetch latest medical record after successful update
      try {
        const latestRecord = await getLatestMedicalRecordByPatientId(patientId);
        setLatestMedicalRecord(latestRecord);
        
        // Update patient data with latest medical record values
        if (latestRecord) {
          updatedPatient.medical_records = latestRecord.medical_records;
          updatedPatient.bp_at_goal = latestRecord.bpAtGoal;
          updatedPatient.hospital_visited_since_last_review = latestRecord.hospitalVisitSinceLastReview;
          updatedPatient.a1c_at_goal = latestRecord.a1cAtGoal;
          updatedPatient.use_benzo = latestRecord.benzodiazepines;
          updatedPatient.use_antipsychotic = latestRecord.antipsychotics;
          updatedPatient.use_opioids = latestRecord.opioids;
          updatedPatient.fall_since_last_visit = latestRecord.fallSinceLastVisit;
        }
      } catch (medicalRecordError) {
        console.error("Error fetching latest medical record:", medicalRecordError);
      }
      
      setPatient(updatedPatient);
      setEditedPatient(updatedPatient);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating patient:", err);
      setError("Failed to save patient. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!editedPatient) return;

    const updatedPatient = { ...editedPatient, [field]: value };
    
    // If site name changed, update available buildings
    if (field === 'site_name') {
      console.log('Site name changed to:', value);
      const selectedSite = sitesAndBuildings.find(site => site.site_name === value);
      console.log('Found site:', selectedSite);
      if (selectedSite) {
        console.log('Setting available buildings for new site:', selectedSite.building_names);
        setAvailableBuildings(selectedSite.building_names);
        // Reset building when site changes
        updatedPatient.building = '';
      }
    }
    
    setEditedPatient(updatedPatient);
  };

  // Add activity sorting handler
  const handleActivitySort = (field: typeof activitySortField) => {
    if (activitySortField === field) {
      setActivitySortDirection(activitySortDirection === "asc" ? "desc" : "asc")
    } else {
      setActivitySortField(field)
      setActivitySortDirection("asc")
    }
  }

  // Filter and sort activities
  const filteredAndSortedActivities = useMemo(() => {
    if (!activities) return [];

    // Filter activities by month and year
    const filteredActivities = activities
      .filter((activity): activity is Required<ServiceActivity> => activity.id !== undefined)
      .map(activity => ({
        activityId: activity.id.toString(),
        activityType: activity.activity_type,
        initials: activity.user_initials || 'N/A',
        recordDate: (activity.service_datetime || activity.created_at || new Date().toISOString()).toString(),
        totalTime: activity.duration_minutes,
        time_spent: activity.duration_minutes,
        duration_minutes: activity.duration_minutes
      }))
      .filter(activity => {
        const activityDate = new Date(activity.recordDate);
        const matchesMonth = activityMonthFilter === "all" || 
          activityDate.getMonth() + 1 === Number.parseInt(activityMonthFilter);
        const matchesYear = activityYearFilter === "all" || 
          activityDate.getFullYear() === Number.parseInt(activityYearFilter);
        return matchesMonth && matchesYear;
      });

    // Sort the activities
    return filteredActivities.sort((a, b) => {
      if (!activitySortField) return Number(b.activityId) - Number(a.activityId); // Default sort by activity ID desc (greatest to lowest)

      let aValue: any = a[activitySortField];
      let bValue: any = b[activitySortField];

      // Special handling for dates
      if (activitySortField === "recordDate") {
        aValue = new Date(a.recordDate).getTime();
        bValue = new Date(b.recordDate).getTime();
      }

      if (aValue < bValue) return activitySortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return activitySortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [activities, activityMonthFilter, activityYearFilter, activitySortField, activitySortDirection]);

  const handleDeletePatient = async () => {
    if (!patientId) return;
    
    setIsDeletingPatient(true);
    try {
      await deletePatient(patientId);
      navigate('/patients'); // Navigate back to patients list after successful deletion
    } catch (err) {
      console.error("Error deleting patient:", err);
      alert("Failed to delete patient. Please try again.");
    } finally {
      setIsDeletingPatient(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !patientData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-red-600 mb-4 text-5xl">!</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Patient</h2>
          <p className="text-gray-600 mb-4">{error || "Patient data not found"}</p>
          <button 
            onClick={() => navigate('/patients')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Patients List
          </button>
        </div>
      </div>
    )
  }

  const patientFullName = patient ? `${patient.last_name}, ${patient.first_name}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/patients')}
              className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              title="Back to All Patients"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Patient Details</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                {!isPharmacist && (
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Patient
                  </button>
                )}
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              !isNurse && (
                <button
                  onClick={handleEditPatient}
                  className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out cursor-pointer w-full sm:w-auto"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Patient
                </button>
              )
            )}
          </div>
        </div>

        {/* Patient Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h2>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Inactive</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={editedPatient?.is_active}
                        onClick={() => !isPharmacist && handleFieldChange('is_active', !editedPatient?.is_active)}
                        disabled={isPharmacist}
                        className={`${
                          editedPatient?.is_active ? 'bg-blue-600' : 'bg-gray-200'
                        } ${
                          isPharmacist ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          !isPharmacist && 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                        title={isPharmacist ? "Pharmacists cannot change patient active status" : "Toggle patient active status"}
                      >
                        <span
                          aria-hidden="true"
                          className={`${
                            editedPatient?.is_active ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </button>
                      <span className="text-sm text-gray-600">Active</span>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      patientData?.patient.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {patientData?.patient.is_active ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1">
                    <DetailRow
                      label="First Name"
                      value={isEditing ? editedPatient?.first_name : patientData?.patient.first_name}
                      isEditing={isEditing}
                      editType="text"
                      onEdit={(value) => handleFieldChange('first_name', value)}
                      forceReadOnly={isPharmacist}
                    />
                    <div className="mt-6">
                      <DetailRow
                        label="Last Name"
                        value={isEditing ? editedPatient?.last_name : patientData?.patient.last_name}
                        isEditing={isEditing}
                        editType="text"
                        onEdit={(value) => handleFieldChange('last_name', value)}
                        forceReadOnly={isPharmacist}
                      />
                    </div>
                    <div className="mt-6">
                      <DetailRow
                        label="Birth Date"
                        value={isEditing ? editedPatient?.birthdate : patientData?.patient.birthdate}
                        isEditing={isEditing}
                        editType="date"
                        onEdit={(value) => handleFieldChange('birthdate', value)}
                        forceReadOnly={isPharmacist}
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-1">
                    <DetailRow
                      label="Site Name"
                      value={isEditing ? editedPatient?.site_name : patientData?.patient.site_name}
                      isEditing={isEditing}
                      editType="select"
                      editOptions={sitesAndBuildings.map(site => site.site_name)}
                      onEdit={(value) => handleFieldChange('site_name', value)}
                      forceReadOnly={isPharmacist}
                    />
                    <div className="mt-6">
                      <DetailRow
                        label="Building"
                        value={isEditing ? editedPatient?.building : patientData?.patient.building}
                        isEditing={isEditing}
                        editType="select"
                        editOptions={availableBuildings}
                        onEdit={(value) => handleFieldChange('building', value)}
                        forceReadOnly={isPharmacist}
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-1">
                    <DetailRow
                      label="Gender"
                      value={isEditing ? 
                        (editedPatient?.gender ? genderOptions[editedPatient.gender as GenderCode] : '') : 
                        getGenderDisplay(patientData?.patient.gender)
                      }
                      isEditing={isEditing}
                      editType="select"
                      editOptions={Object.values(genderOptions)}
                      onEdit={(value) => handleFieldChange('gender', getGenderValue(value))}
                      forceReadOnly={isPharmacist}
                    />
                    <div className="mt-6">
                      <DetailRow
                        label="Insurance"
                        value={isEditing ? editedPatient?.insurance : patientData?.patient.insurance}
                        isEditing={isEditing}
                        editType="text"
                        onEdit={(value) => handleFieldChange('insurance', value)}
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-1 md:col-span-2 lg:row-span-2">
                    <DetailRow
                      label="Notes"
                      value={isEditing ? editedPatient?.notes : patientData?.patient.notes}
                      isEditing={isEditing}
                      editType="textarea"
                      onEdit={(value) => handleFieldChange('notes', value)}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-blue-600" />
                    Patient Status
                  </h2>
                  <button
                    onClick={() => setIsLastUpdatedModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Last Updated</span>
                    <span className="text-blue-600 font-medium">
                      {latestMedicalRecord?.createdAt 
                        ? new Date(latestMedicalRecord.createdAt).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Medical Status */}
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Medical Records:</span>
                        <span className={`text-sm font-medium ${patientData?.patient.medical_records ? 'text-green-600' : 'text-red-600'}`}>
                          {patientData?.patient.medical_records ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">BP at Goal:</span>
                        <span className={`text-sm font-medium ${patientData?.patient.bp_at_goal ? 'text-green-600' : 'text-red-600'}`}>
                          {patientData?.patient.bp_at_goal ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hospital className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Hospital Visit Since Last Review:</span>
                        <span className={`text-sm font-medium ${patientData?.patient.hospital_visited_since_last_review ? 'text-green-600' : 'text-red-600'}`}>
                          {patientData?.patient.hospital_visited_since_last_review ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">A1C at Goal:</span>
                        <span className={`text-sm font-medium ${patientData?.patient.a1c_at_goal ? 'text-green-600' : 'text-red-600'}`}>
                          {patientData?.patient.a1c_at_goal ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Medication Status */}
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Benzodiazepines:</span>
                        <span className={`text-sm font-medium ${patientData?.patient.use_benzo ? 'text-green-600' : 'text-red-600'}`}>
                          {patientData?.patient.use_benzo ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Syringe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Antipsychotics:</span>
                        <span className={`text-sm font-medium ${patientData?.patient.use_antipsychotic ? 'text-green-600' : 'text-red-600'}`}>
                          {patientData?.patient.use_antipsychotic ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Opioids:</span>
                        <span className={`text-sm font-medium ${patientData?.patient.use_opioids ? 'text-green-600' : 'text-red-600'}`}>
                          {patientData?.patient.use_opioids ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Fall Since Last Visit:</span>
                        <span className={`text-sm font-medium ${patientData?.patient.fall_since_last_visit ? 'text-green-600' : 'text-red-600'}`}>
                          {patientData?.patient.fall_since_last_visit ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-blue-600" />
                Activities
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Filters Container */}
                <div className="flex flex-row gap-3">
                  {/* Month Filter */}
                  <div className="relative min-w-0 flex-1 w-full sm:w-32">
                    <select
                      value={activityMonthFilter}
                      onChange={(e) => setActivityMonthFilter(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border appearance-none"
                    >
                      <option value="all">All Months</option>
                      {months.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>

                  {/* Year Filter */}
                  <div className="relative min-w-0 flex-1 w-full sm:w-28">
                    <select
                      value={activityYearFilter}
                      onChange={(e) => {
                        setActivityYearFilter(e.target.value);
                        setActivityMonthFilter("all"); // Reset month filter to "all" when year changes
                      }}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border appearance-none"
                    >
                      <option value="all">All Years</option>
                      {activityYears.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                {patientData?.patient.is_active && (
                  <button
                    className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out cursor-pointer w-full sm:w-auto whitespace-nowrap"
                    onClick={handleAddActivity}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </button>
                )}
              </div>
            </div>
            
            {filteredAndSortedActivities.length > 0 ? (
              <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleActivitySort("activityId")}
                      >
                        <div className="flex items-center">
                          <span className="hidden sm:inline">Activity #</span>
                          <span className="sm:hidden">#</span>
                          <div className="ml-1 flex">
                            <ArrowUpIcon
                              className={`h-3 w-3 ${
                                activitySortField === "activityId" && activitySortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                              }`}
                            />
                            <ArrowDownIcon
                              className={`h-3 w-3 ${
                                activitySortField === "activityId" && activitySortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                              }`}
                            />
                          </div>
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleActivitySort("activityType")}
                      >
                        <div className="flex items-center">
                          <span className="hidden sm:inline">Activity Type</span>
                          <span className="sm:hidden">Type</span>
                          <div className="ml-1 flex">
                            <ArrowUpIcon
                              className={`h-3 w-3 ${
                                activitySortField === "activityType" && activitySortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                              }`}
                            />
                            <ArrowDownIcon
                              className={`h-3 w-3 ${
                                activitySortField === "activityType" && activitySortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                              }`}
                            />
                          </div>
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleActivitySort("initials")}
                      >
                        <div className="flex items-center">
                          <span>Initials</span>
                          <div className="ml-1 flex">
                            <ArrowUpIcon
                              className={`h-3 w-3 ${
                                activitySortField === "initials" && activitySortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                              }`}
                            />
                            <ArrowDownIcon
                              className={`h-3 w-3 ${
                                activitySortField === "initials" && activitySortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                              }`}
                            />
                          </div>
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleActivitySort("recordDate")}
                      >
                        <div className="flex items-center">
                          <span className="hidden sm:inline">Activity Date</span>
                          <span className="sm:hidden">Date</span>
                          <div className="ml-1 flex">
                            <ArrowUpIcon
                              className={`h-3 w-3 ${
                                activitySortField === "recordDate" && activitySortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                              }`}
                            />
                            <ArrowDownIcon
                              className={`h-3 w-3 ${
                                activitySortField === "recordDate" && activitySortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                              }`}
                            />
                          </div>
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleActivitySort("totalTime")}
                      >
                        <div className="flex items-center">
                          <span className="hidden sm:inline">Total Time</span>
                          <span className="sm:hidden">Time</span>
                          <div className="ml-1 flex">
                            <ArrowUpIcon
                              className={`h-3 w-3 ${
                                activitySortField === "totalTime" && activitySortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                              }`}
                            />
                            <ArrowDownIcon
                              className={`h-3 w-3 ${
                                activitySortField === "totalTime" && activitySortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                              }`}
                            />
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedActivities.map((activity) => (
                      <tr 
                        key={activity.activityId} 
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        onClick={() => handleActivityClick(activity.activityId)}
                      >
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className="text-blue-600 hover:text-blue-900 hover:underline">
                            {activity.activityId}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                          <div className="truncate max-w-32 sm:max-w-none" title={activity.activityType}>
                            {activity.activityType}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.initials}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="hidden sm:block">
                            {new Date(activity.recordDate).toLocaleDateString()}
                          </div>
                          <div className="sm:hidden">
                            {new Date(activity.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTimeSpent(activity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600">
                  {activityMonthFilter === 'all' 
                    ? "No activities found for this patient."
                    : `No activities found for this patient in ${months[parseInt(activityMonthFilter) - 1]} ${activityYearFilter === 'all' ? '' : activityYearFilter}.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Last Updated Modal */}
      <StatusHistoryModal
        isOpen={isLastUpdatedModalOpen}
        onClose={() => setIsLastUpdatedModalOpen(false)}
        patientId={patientId}
      />

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={() => setIsAddActivityModalOpen(false)}
        onActivityAdded={handleActivityAdded}
        patientId={patientId}
        patientName={patientFullName}
      />

      {/* Delete Patient Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePatient}
        isDeleting={isDeletingPatient}
        itemName={`patient "${patient?.first_name} ${patient?.last_name}"`}
      />
    </div>
  )
}