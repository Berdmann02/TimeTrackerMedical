import { useState } from "react"
import { User, Phone, Calendar, MapPin, Shield, Activity, Clock } from "lucide-react"
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
      phoneNumber: "(555) 123-4567",
      contactName: "Jane Doe",
      contactPhoneNumber: "(555) 987-6543",
      insurance: "Health Plus Insurance",
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{`${patientData.patient.firstName} ${patientData.patient.lastName}`}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birth Date</label>
                    <p className="text-gray-900">{new Date(patientData.patient.birthDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-gray-900">{patientData.patient.gender}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-gray-900">{patientData.patient.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                    <p className="text-gray-900">{patientData.patient.contactName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Phone</label>
                    <p className="text-gray-900">{patientData.patient.contactPhoneNumber}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Additional Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Site Name</label>
                    <p className="text-gray-900">{patientData.patient.siteName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Insurance</label>
                    <p className="text-gray-900">{patientData.patient.insurance}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Activities
            </h2>
            
            <div className="overflow-x-auto">
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
                    <tr key={activity.activityId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleActivityClick(activity.activityId)}
                          className="inline-flex items-center px-2 py-1 rounded text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {activity.activityId}
                        </button>
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