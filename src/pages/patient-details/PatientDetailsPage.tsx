import { useState, useEffect } from "react"
import { User, MapPin, Shield, Activity, Plus, ChevronLeft, Pencil, ClipboardCheck, Heart, Hospital, FileText, Pill, AlertTriangle, Syringe } from "lucide-react"
import type { PatientWithActivities } from "../../types/patient"
import { useNavigate, useParams } from "react-router-dom"
import { getPatientById, getPatientActivities } from "../../services/patientService"
import type { Patient, Activity as ApiActivity } from "../../services/patientService"
import AddActivityModal from "../../components/AddActivityModal"

export default function PatientDetailsPage() {
  const navigate = useNavigate()
  const { patientId } = useParams<{ patientId: string }>()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [activities, setActivities] = useState<ApiActivity[]>([])
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false)

  // Fetch patient data and activities
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) {
        setError("No patient ID provided")
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      setError(null)
      
      try {
        // First, try to get the patient details
        const patientData = await getPatientById(patientId)
        setPatient(patientData)
        
        // Then try to get activities, but don't fail the whole request if this fails
        try {
          const activitiesData = await getPatientActivities(patientId)
          setActivities(activitiesData)
        } catch (activityError) {
          console.error("Error fetching patient activities:", activityError)
          // Just set empty activities instead of failing completely
          setActivities([])
        }
      } catch (err) {
        console.error("Error fetching patient data:", err)
        setError("Failed to load patient data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPatientData()
  }, [patientId])

  // Convert API data to format expected by the component
  const patientData: PatientWithActivities | null = patient ? {
    patient: {
      firstName: patient.first_name,
      lastName: patient.last_name,
      birthDate: patient.birthdate,
      gender: patient.gender,
      siteName: patient.site_name,
      isActivePatient: patient.is_active,
      phoneNumber: patient.phone_number || undefined,
      contactName: patient.contact_name || undefined,
      contactPhoneNumber: patient.contact_phone_number || undefined,
      insurance: patient.insurance || undefined,
      medicalRecordsCompleted: patient.medical_records_completed,
      bpAtGoal: patient.bp_at_goal,
      hospitalVisitedSinceLastReview: patient.hospital_visited_since_last_review,
      a1cAtGoal: patient.a1c_at_goal,
      useBenzo: patient.use_benzo,
      fallSinceLastVisit: patient.fall_since_last_visit,
      useAntipsychotic: patient.use_antipsychotic,
      useOpioids: patient.use_opioids
    },
    activities: activities.map(activity => ({
      activityId: activity.id?.toString() || '',
      activityType: activity.activity_type || '',
      initials: activity.user_initials || activity.personnel_initials || '',
      recordDate: activity.created_at || activity.service_datetime || new Date().toISOString(),
      totalTime: activity.time_spent !== undefined ? activity.time_spent : 
                (activity.duration_minutes !== undefined ? activity.duration_minutes : 0)
    }))
  } : null

  const handleActivityClick = (activityId: string) => {
    navigate(`/activity/${activityId}`)
  }

  const handleAddActivity = () => {
    setIsAddActivityModalOpen(true);
  }

  const handleActivityAdded = () => {
    // Refresh activities after adding a new one
    if (patientId) {
      getPatientActivities(patientId)
        .then(data => setActivities(data))
        .catch(err => console.error("Failed to refresh activities:", err));
    }
  }

  const handleEditPatient = () => {
    // TODO: Implement edit patient functionality
    console.log("Edit patient clicked")
  }

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

  const patientFullName = `${patientData.patient.lastName}, ${patientData.patient.firstName}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/patients')}
              className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              title="Back to All Patients"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
          </div>
          <button
            onClick={handleEditPatient}
            className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Patient
          </button>
        </div>

        {/* Patient Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block">Full Name</label>
                    <p className="text-gray-900 mt-1 text-lg font-medium">{`${patientData.patient.firstName} ${patientData.patient.lastName}`}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block">Birth Date</label>
                      <p className="text-gray-900 mt-1">{new Date(patientData.patient.birthDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block">Gender</label>
                      <p className="text-gray-900 mt-1">{patientData.patient.gender}</p>
                    </div>
                  </div>
                </div>

                {/* Medical Status */}
                <div className="pt-4 border-t border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-blue-600" />
                    Medical Status
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Medical Records:</span>
                      <span className={`text-sm font-medium ${patientData.patient.medicalRecordsCompleted ? 'text-green-600' : 'text-red-600'}`}>
                        {patientData.patient.medicalRecordsCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">BP at Goal:</span>
                      <span className={`text-sm font-medium ${patientData.patient.bpAtGoal ? 'text-green-600' : 'text-red-600'}`}>
                        {patientData.patient.bpAtGoal ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hospital className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Hospital Visit:</span>
                      <span className={`text-sm font-medium ${patientData.patient.hospitalVisitedSinceLastReview ? 'text-red-600' : 'text-green-600'}`}>
                        {patientData.patient.hospitalVisitedSinceLastReview ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">A1C at Goal:</span>
                      <span className={`text-sm font-medium ${patientData.patient.a1cAtGoal ? 'text-green-600' : 'text-red-600'}`}>
                        {patientData.patient.a1cAtGoal ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Additional Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block">Site Name</label>
                    <p className="text-gray-900 mt-1">{patientData.patient.siteName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block">Status</label>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      patientData.patient.isActivePatient
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {patientData.patient.isActivePatient ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Medication Status */}
                <div className="pt-4 border-t border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Pill className="w-5 h-5 text-blue-600" />
                    Medication Status
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Benzodiazepines:</span>
                      <span className={`text-sm font-medium ${patientData.patient.useBenzo ? 'text-yellow-600' : 'text-green-600'}`}>
                        {patientData.patient.useBenzo ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Syringe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Antipsychotics:</span>
                      <span className={`text-sm font-medium ${patientData.patient.useAntipsychotic ? 'text-yellow-600' : 'text-green-600'}`}>
                        {patientData.patient.useAntipsychotic ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Opioids:</span>
                      <span className={`text-sm font-medium ${patientData.patient.useOpioids ? 'text-yellow-600' : 'text-green-600'}`}>
                        {patientData.patient.useOpioids ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Fall Since Last Visit:</span>
                      <span className={`text-sm font-medium ${patientData.patient.fallSinceLastVisit ? 'text-red-600' : 'text-green-600'}`}>
                        {patientData.patient.fallSinceLastVisit ? 'Yes' : 'No'}
                      </span>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Activities
              </h2>
              <button
                className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out cursor-pointer"
                onClick={handleAddActivity}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </button>
            </div>
            
            {patientData.activities.length > 0 ? (
              <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity #
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Initials
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Record Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patientData.activities.map((activity) => (
                      <tr 
                        key={activity.activityId} 
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        onClick={() => handleActivityClick(activity.activityId)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className="text-blue-600 hover:text-blue-900 hover:underline">
                            {activity.activityId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.activityType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.initials}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(activity.recordDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {typeof activity.totalTime === 'number' 
                            ? `${activity.totalTime.toFixed(2)} minutes` 
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600">No activities found for this patient.</p>
                {/* <button
                  onClick={handleAddActivity}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-blue-600 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Activity
                </button> */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={() => setIsAddActivityModalOpen(false)}
        onActivityAdded={handleActivityAdded}
        patientId={patientId}
        patientName={patientFullName}
        siteName={patientData.patient.siteName}
      />
    </div>
  )
}