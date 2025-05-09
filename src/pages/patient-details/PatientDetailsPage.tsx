import { useState } from "react"
import { User, MapPin, Shield, Activity, Plus } from "lucide-react"
import type { PatientWithActivities } from "../../types/patient"
import { useNavigate } from "react-router-dom"

export default function PatientDetailsPage() {
  const navigate = useNavigate()
  // In a real app, this would be fetched from an API
  const [patientData] = useState<PatientWithActivities>({
    patient: {
      firstName: "John",
      lastName: "Doe",
      birthDate: "1980-01-15",
      gender: "M",
      siteName: "Main Clinic",
      isActivePatient: true
    },
    activities: [
      {
        activityId: "ACT001",
        activityType: "Assess medical - functional - psychosocial needs",
        initials: "JD",
        isPharmacist: true,
        recordDate: "2024-04-30",
        totalTime: 25.5
      },
      {
        activityId: "ACT002",
        activityType: "Assess medical - functional - psychosocial needs",
        initials: "JD",
        isPharmacist: true,
        recordDate: "2024-03-15",
        totalTime: 30.2
      },
      {
        activityId: "ACT003",
        activityType: "Assess medical - functional - psychosocial needs",
        initials: "JD",
        isPharmacist: true,
        recordDate: "2024-02-01",
        totalTime: 22.8
      }
    ]
  })

  const handleActivityClick = (activityId: string) => {
    navigate(`/activity/${activityId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Patient Details</h1>

        {/* Patient Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h2>
                <div className="flex items-center gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block">Full Name</label>
                    <p className="text-gray-900 mt-1 text-lg font-medium">{`${patientData.patient.firstName} ${patientData.patient.lastName}`}</p>
                  </div>
                  <div className="flex items-center gap-6">
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
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Additional Information
                </h2>
                <div className="flex items-center gap-6">
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
                onClick={() => navigate('/activity')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </button>
            </div>
            
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
                      Pharm?
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
                        {activity.isPharmacist ? "Y" : "N"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(activity.recordDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.totalTime.toFixed(2)} minutes
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}