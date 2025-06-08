import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSites } from '../../services/siteService';
import { getPatients } from '../../services/patientService';
import { getActivitiesByPatientId } from '../../services/activityService';
import type { Site } from '../../services/siteService';
import type { Patient } from '../../services/patientService';
import type { Activity } from '../../services/activityService';

interface PatientActivityData {
  patientId: number;
  patientName: string;
  totalMinutes: number;
  totalHours: number;
  activityCount: number;
}

interface SitePatientData {
  siteName: string;
  siteId?: number;
  patients: PatientActivityData[];
  totalSiteMinutes: number;
  totalSiteHours: number;
  totalSiteActivities: number;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

const PatientReportsPage = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(currentYear);
  const [isLoading, setIsLoading] = useState(false);
  const [siteData, setSiteData] = useState<SitePatientData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleGenerateReports();
  }, [month, year]);

  const handleGenerateReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all sites and patients
      const sites = await getSites();
      const allPatients = await getPatients();

      const siteReports: SitePatientData[] = [];

      for (const site of sites) {
        const sitePatients = allPatients.filter(patient => patient.site_name === site.name);
        const patientActivityData: PatientActivityData[] = [];

        let totalSiteMinutes = 0;
        let totalSiteActivities = 0;

        for (const patient of sitePatients) {
          if (patient.id) {
            try {
              const activities = await getActivitiesByPatientId(patient.id);
              
              // Filter activities by month/year
              const filteredActivities = activities.filter(activity => {
                const activityDate = new Date(activity.service_datetime);
                return activityDate.getMonth() + 1 === month && activityDate.getFullYear() === year;
              });

              // Calculate total minutes for this patient
              const patientMinutes = filteredActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
              const patientHours = Math.round((patientMinutes / 60) * 100) / 100; // Round to 2 decimal places

              patientActivityData.push({
                patientId: patient.id,
                patientName: `${patient.first_name} ${patient.last_name}`,
                totalMinutes: patientMinutes,
                totalHours: patientHours,
                activityCount: filteredActivities.length
              });

              totalSiteMinutes += patientMinutes;
              totalSiteActivities += filteredActivities.length;

            } catch (err) {
              console.error(`Error fetching activities for patient ${patient.id}:`, err);
              // Add patient with 0 data if fetch fails
              patientActivityData.push({
                patientId: patient.id,
                patientName: `${patient.first_name} ${patient.last_name}`,
                totalMinutes: 0,
                totalHours: 0,
                activityCount: 0
              });
            }
          }
        }

        const totalSiteHours = Math.round((totalSiteMinutes / 60) * 100) / 100;

        siteReports.push({
          siteName: site.name,
          siteId: site.id,
          patients: patientActivityData,
          totalSiteMinutes,
          totalSiteHours,
          totalSiteActivities
        });
      }

      setSiteData(siteReports);

    } catch (err) {
      console.error('Error generating patient reports:', err);
      setError('Failed to generate patient reports');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Patient Reports</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
            >
              Overall Reports
            </button>
            <button
              onClick={() => navigate('/site-reports')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
            >
              Site Reports
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <div className="relative">
                  <select
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    {months.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <div className="relative">
                  <select
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Generating patient reports...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Report Tables */}
        {!isLoading && siteData.length > 0 && (
          <div className="space-y-8">
            {siteData.map((site, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">{site.siteName}</h2>
                    <div className="text-sm text-gray-600">
                      Total: {site.totalSiteHours} hours ({site.totalSiteMinutes} minutes) | {site.totalSiteActivities} activities
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Minutes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {site.patients.map((patient, patientIndex) => (
                        <tr key={patientIndex} className={patient.totalMinutes === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {patient.patientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.totalHours}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.totalMinutes}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.activityCount}
                          </td>
                        </tr>
                      ))}
                      {site.patients.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No patients found for this site
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && siteData.length === 0 && !error && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No data found for the selected month and year.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientReportsPage; 