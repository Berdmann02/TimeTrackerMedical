import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getSites } from '../../services/siteService';
import { getPatients } from '../../services/patientService';
import { getActivitiesWithDetails } from '../../services/activityService';
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

// Utility function to format time display
const formatTimeDisplay = (minutes: number): string => {
  if (minutes === 0) return "0.00";
  if (minutes < 60) {
    return minutes.toFixed(2);
  }
  const hours = minutes / 60;
  return hours.toFixed(2);
};

// Utility function to format time for display with units
const formatTimeWithUnits = (minutes: number): string => {
  if (minutes === 0) return "0.00 minutes";
  if (minutes < 60) {
    return `${minutes.toFixed(2)} minutes`;
  }
  const hours = minutes / 60;
  return `${hours.toFixed(2)} hours`;
};

// Utility function to check if activity belongs to the selected month/year
const isActivityInMonth = (activity: Activity, month: number, year: number): boolean => {
  // Use service_datetime as primary, fall back to created_at
  const dateToCheck = activity.service_datetime || activity.created_at;
  if (!dateToCheck) return false;
  
  try {
    const activityDate = new Date(dateToCheck);
    if (isNaN(activityDate.getTime())) return false;
    
    return activityDate.getMonth() + 1 === month && activityDate.getFullYear() === year;
  } catch (error) {
    console.error('Error parsing activity date:', error);
    return false;
  }
};

const PatientReportsPage = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [siteData, setSiteData] = useState<SitePatientData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUnderTwentyMin, setShowUnderTwentyMin] = useState(false);
  const [groupBySite, setGroupBySite] = useState(true);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const handleGenerateReports = async () => {
    setIsLoading(true);
    setError(null);
    setSiteData([]);

    try {
      const [sites, allPatients, allActivities] = await Promise.all([
        getSites(),
        getPatients(),
        getActivitiesWithDetails()
      ]);

      const siteReports: SitePatientData[] = [];

      for (const site of sites) {
        const sitePatients = allPatients.filter(patient => patient.site_name === site.name);
        const patientActivityData: PatientActivityData[] = [];

        let totalSiteMinutes = 0;
        let totalSiteActivities = 0;

        for (const patient of sitePatients) {
          if (patient.id) {
            try {
              // Filter activities for this specific patient and ensure time_spent is set
              const patientActivities = allActivities
                .filter((activity: Activity) => activity.patient_id === patient.id)
                .map((activity: Activity) => ({
                  ...activity,
                  time_spent: activity.duration_minutes // Ensure time_spent is available like in Medical Activities
                }));
              
              // Filter activities by month/year using the improved function
              const filteredActivities = patientActivities.filter((activity: Activity) => 
                isActivityInMonth(activity, month, year)
              );

              // Calculate total minutes for this patient (using same logic as Medical Activities)
              const patientMinutes = filteredActivities.reduce((sum: number, activity: any) => {
                const timeSpent = activity.time_spent;
                const durationMinutes = activity.duration_minutes;
                
                let activityMinutes = 0;
                
                if (timeSpent !== undefined && timeSpent !== null && !isNaN(Number(timeSpent))) {
                  activityMinutes = Number(timeSpent);
                } else if (durationMinutes !== undefined && durationMinutes !== null && !isNaN(Number(durationMinutes))) {
                  activityMinutes = Number(durationMinutes);
                }
                
                return sum + activityMinutes;
              }, 0);
              
              const patientHours = patientMinutes / 60; // Don't round here, let the display function handle it

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
              console.error(`Error processing activities for patient ${patient.id}:`, err);
              // Add patient with 0 data if processing fails
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

        const totalSiteHours = totalSiteMinutes / 60; // Don't round here either

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

  // Auto-load current month's data when component mounts
  useEffect(() => {
    handleGenerateReports();
  }, []); // Only run on mount, not when month/year changes

  // Process data based on filters
  const processedData = useMemo(() => {
    if (!groupBySite) {
      // Flatten all patients into a single list when not grouping by site
      const allPatients = siteData.flatMap(site => 
        site.patients.map(patient => ({
          ...patient,
          siteName: site.siteName
        }))
      );

      // Filter patients if under 20 minutes filter is active
      const filteredPatients = showUnderTwentyMin 
        ? allPatients.filter(patient => patient.totalMinutes < 20)
        : allPatients;

      // Create a single "site" containing all patients
      return [{
        siteName: "All Sites",
        patients: filteredPatients,
        totalSiteMinutes: filteredPatients.reduce((sum, p) => sum + p.totalMinutes, 0),
        totalSiteHours: filteredPatients.reduce((sum, p) => sum + p.totalHours, 0),
        totalSiteActivities: filteredPatients.reduce((sum, p) => sum + p.activityCount, 0)
      }];
    } else {
      // When grouping by site, filter patients within each site
      return siteData.map(site => ({
        ...site,
        patients: showUnderTwentyMin 
          ? site.patients.filter(patient => patient.totalMinutes < 20)
          : site.patients,
        totalSiteMinutes: showUnderTwentyMin 
          ? site.patients.filter(patient => patient.totalMinutes < 20)
              .reduce((sum, p) => sum + p.totalMinutes, 0)
          : site.totalSiteMinutes,
        totalSiteHours: showUnderTwentyMin 
          ? site.patients.filter(patient => patient.totalMinutes < 20)
              .reduce((sum, p) => sum + p.totalHours, 0)
          : site.totalSiteHours,
        totalSiteActivities: showUnderTwentyMin 
          ? site.patients.filter(patient => patient.totalMinutes < 20)
              .reduce((sum, p) => sum + p.activityCount, 0)
          : site.totalSiteActivities
      }));
    }
  }, [siteData, groupBySite, showUnderTwentyMin]);

  // Export function for patient reports
  const handleExportData = () => {
    if (processedData.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for export with title at the top
    const exportData: (string | number)[][] = [];
    
    // Add title rows at the very top, above table headers
    exportData.push(['Patient Reports']);
    exportData.push([`Month: ${month}, Year: ${year}`]);
    if (showUnderTwentyMin) {
      exportData.push(['Filter: Showing only patients under 20 minutes']);
    }
    if (!groupBySite) {
      exportData.push(['View: All patients (ungrouped by site)']);
    }
    exportData.push(['']); // Empty row for spacing
    
    // Add table headers
    const headers = ['Patient Name'];
    if (!groupBySite) {
      headers.push('Site');
    }
    headers.push('Total Hours', 'Total Minutes', 'Activity Count');
    exportData.push(headers);
    
    // Add data rows
    processedData.forEach(site => {
      if (groupBySite && site.siteName !== "All Sites") {
        // Add site header when grouping by site
        exportData.push([`--- ${site.siteName} ---`, '', '', '', '']);
      }
      
      site.patients.forEach((patient: any) => {
        const row: (string | number)[] = [patient.patientName];
        if (!groupBySite) {
          row.push(patient.siteName);
        }
        row.push(
          patient.totalHours.toFixed(2),
          patient.totalMinutes.toFixed(2),
          patient.activityCount
        );
        exportData.push(row);
      });
      
      if (groupBySite && site.siteName !== "All Sites") {
        // Add site totals when grouping by site
        const totalRow: (string | number)[] = [`Total for ${site.siteName}`];
        if (!groupBySite) {
          totalRow.push('');
        }
        totalRow.push(
          (site.totalSiteMinutes / 60).toFixed(2),
          site.totalSiteMinutes.toFixed(2),
          site.totalSiteActivities
        );
        exportData.push(totalRow);
        exportData.push(['']); // Empty row between sites
      }
    });

    // Create workbook and worksheet from array of arrays
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Patient Reports');

    // Generate filename with current date and filters
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Patient_Reports_${month}_${year}_${currentDate}.xlsx`;

    // Save the file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patient Reports</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExportData}
              disabled={isLoading || processedData.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Data
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              Overall Reports
            </button>
            <button
              onClick={() => navigate('/site-reports')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              Site Reports
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <div className="flex items-end">
                <button
                  onClick={handleGenerateReports}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generating...' : 'Generate Reports'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={groupBySite}
                  onChange={(e) => setGroupBySite(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Group by Site</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showUnderTwentyMin}
                  onChange={(e) => setShowUnderTwentyMin(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Only Patients Under 20 Minutes</span>
              </label>
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
        {!isLoading && processedData.length > 0 && (
          <div className="space-y-8">
            {processedData.map((site, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">{site.siteName}</h2>
                    <div className="text-sm text-gray-600">
                      Total: {formatTimeWithUnits(site.totalSiteMinutes)} | {site.totalSiteActivities} activities
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
                        {!groupBySite && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Site
                          </th>
                        )}
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
                      {site.patients.map((patient: any, patientIndex: number) => (
                        <tr key={patientIndex} className={patient.totalMinutes === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {patient.patientName}
                          </td>
                          {!groupBySite && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {patient.siteName}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.totalHours.toFixed(2)} hours
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.totalMinutes.toFixed(2)} minutes
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.activityCount}
                          </td>
                        </tr>
                      ))}
                      {site.patients.length === 0 && (
                        <tr>
                          <td colSpan={!groupBySite ? 5 : 4} className="px-6 py-4 text-center text-sm text-gray-500">
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

        {!isLoading && processedData.length === 0 && !error && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No patient activity data found for the selected month and year. Try selecting a different month or year and click "Generate Reports".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientReportsPage; 