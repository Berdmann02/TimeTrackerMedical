import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getSites } from '../../services/siteService';
import { getPatients } from '../../services/patientService';
import { getActivitiesWithDetails } from '../../services/activityService';
import { getBuildings } from '../../services/buildingService';
import type { Site } from '../../services/siteService';
import type { Patient } from '../../services/patientService';
import type { Activity } from '../../services/activityService';
import type { Building } from '../../services/buildingService';

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

interface PatientDetailActivity {
  id?: number;
  activity_type: string;
  service_datetime: string;
  duration_minutes: number;
  site_name: string;
  building?: string;
  notes?: string;
  user_initials?: string;
}

interface ChartData {
  name: string;
  value: number;
  fill?: string;
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

  // Patient Detail Report state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [patientActivities, setPatientActivities] = useState<PatientDetailActivity[]>([]);
  const [isLoadingPatientDetail, setIsLoadingPatientDetail] = useState(false);
  const [patientDetailError, setPatientDetailError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

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

  // Load initial data for patient detail report
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [sitesData, buildingsData, patientsData] = await Promise.all([
          getSites(),
          getBuildings(),
          getPatients()
        ]);
        setSites(sitesData);
        setBuildings(buildingsData);
        setPatients(patientsData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadInitialData();
  }, []);

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

  // Generate patient detail report
  const handleGeneratePatientDetailReport = async () => {
    if (!selectedPatient) {
      setPatientDetailError('Please select a patient');
      return;
    }

    setIsLoadingPatientDetail(true);
    setPatientDetailError(null);
    setPatientActivities([]);

    try {
      const allActivities = await getActivitiesWithDetails();
      
      // Filter activities for the selected patient
      let filteredActivities = allActivities.filter((activity: Activity) => 
        activity.patient_id === selectedPatient.id
      );

      // Apply site filter
      if (selectedSite) {
        filteredActivities = filteredActivities.filter((activity: Activity) => 
          activity.site_name === selectedSite.name
        );
      }

      // Apply building filter
      if (selectedBuilding) {
        filteredActivities = filteredActivities.filter((activity: Activity) => 
          activity.building === selectedBuilding.name
        );
      }

      // Apply date range filter
      if (startDate) {
        filteredActivities = filteredActivities.filter((activity: Activity) => {
          const activityDate = new Date(activity.service_datetime);
          const start = new Date(startDate);
          return activityDate >= start;
        });
      }

      if (endDate) {
        filteredActivities = filteredActivities.filter((activity: Activity) => {
          const activityDate = new Date(activity.service_datetime);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          return activityDate <= end;
        });
      }

      // Transform activities for display
      const transformedActivities: PatientDetailActivity[] = filteredActivities.map((activity: Activity) => ({
        id: activity.id,
        activity_type: activity.activity_type,
        service_datetime: typeof activity.service_datetime === 'string' ? activity.service_datetime : activity.service_datetime.toISOString(),
        duration_minutes: activity.duration_minutes,
        site_name: activity.site_name,
        building: activity.building,
        notes: activity.notes,
        user_initials: activity.user_initials
      }));

      setPatientActivities(transformedActivities);

    } catch (error) {
      console.error('Error generating patient detail report:', error);
      setPatientDetailError('Failed to generate patient detail report');
    } finally {
      setIsLoadingPatientDetail(false);
    }
  };

  // Prepare chart data for patient detail report
  const chartData = useMemo(() => {
    if (!patientActivities.length) return [];

    // Group activities by type and sum duration
    const activityTypeData = patientActivities.reduce((acc, activity) => {
      const type = activity.activity_type;
      if (!acc[type]) {
        acc[type] = { name: type, value: 0 };
      }
      acc[type].value += activity.duration_minutes;
      return acc;
    }, {} as Record<string, ChartData>);

    return Object.values(activityTypeData);
  }, [patientActivities]);

  // Prepare time series data for line chart
  const timeSeriesData = useMemo(() => {
    if (!patientActivities.length) return [];

    // Group activities by date and sum duration
    const dateData = patientActivities.reduce((acc, activity) => {
      const date = new Date(activity.service_datetime).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { name: date, value: 0 };
      }
      acc[date].value += activity.duration_minutes;
      return acc;
    }, {} as Record<string, ChartData>);

    return Object.values(dateData).sort((a, b) => 
      new Date(a.name).getTime() - new Date(b.name).getTime()
    );
  }, [patientActivities]);

  // Print patient detail report
  const handlePrintPatientDetailReport = () => {
    if (!selectedPatient || patientActivities.length === 0) {
      alert('No data to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the report');
      return;
    }

    const totalMinutes = patientActivities.reduce((sum, a) => sum + a.duration_minutes, 0);
    const totalHours = totalMinutes / 60;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patient Detail Report - ${selectedPatient.first_name} ${selectedPatient.last_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 24px; font-weight: bold; color: #3B82F6; }
            .summary-label { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .filters { margin-bottom: 20px; font-size: 14px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Patient Detail Report</h1>
            <h2>${selectedPatient.first_name} ${selectedPatient.last_name}</h2>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="filters">
            ${selectedSite ? `<p><strong>Site:</strong> ${selectedSite.name}</p>` : ''}
            ${selectedBuilding ? `<p><strong>Building:</strong> ${selectedBuilding.name}</p>` : ''}
            ${startDate || endDate ? `<p><strong>Date Range:</strong> ${startDate || 'Start'} to ${endDate || 'End'}</p>` : ''}
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-value">${patientActivities.length}</div>
              <div class="summary-label">Total Activities</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalMinutes.toFixed(2)}</div>
              <div class="summary-label">Total Minutes</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalHours.toFixed(2)}</div>
              <div class="summary-label">Total Hours</div>
            </div>
          </div>

          <h3>Activity Details</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity Type</th>
                <th>Duration (Minutes)</th>
                <th>Site</th>
                <th>Building</th>
                <th>Notes</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              ${patientActivities.map((activity) => `
                <tr>
                  <td>${new Date(activity.service_datetime).toLocaleDateString()}</td>
                  <td>${activity.activity_type}</td>
                  <td>${activity.duration_minutes.toFixed(2)}</td>
                  <td>${activity.site_name}</td>
                  <td>${activity.building || '-'}</td>
                  <td>${activity.notes || '-'}</td>
                  <td>${activity.user_initials || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Export patient detail report
  const handleExportPatientDetailReport = () => {
    if (!selectedPatient || patientActivities.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData: (string | number)[][] = [];
    
    // Add title and patient info
    exportData.push(['Patient Detail Report']);
    exportData.push([`Patient: ${selectedPatient.first_name} ${selectedPatient.last_name}`]);
    exportData.push([`Generated: ${new Date().toLocaleDateString()}`]);
    if (selectedSite) {
      exportData.push([`Site: ${selectedSite.name}`]);
    }
    if (selectedBuilding) {
      exportData.push([`Building: ${selectedBuilding.name}`]);
    }
    if (startDate || endDate) {
      exportData.push([`Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`]);
    }
    exportData.push(['']); // Empty row for spacing
    
    // Add table headers
    exportData.push(['Date', 'Activity Type', 'Duration (Minutes)', 'Site', 'Building', 'Notes', 'User']);
    
    // Add data rows
    patientActivities.forEach((activity) => {
      const row: (string | number)[] = [
        new Date(activity.service_datetime).toLocaleDateString(),
        activity.activity_type,
        activity.duration_minutes.toFixed(2),
        activity.site_name,
        activity.building || '',
        activity.notes || '',
        activity.user_initials || ''
      ];
      exportData.push(row);
    });

    // Add summary
    exportData.push(['']);
    exportData.push(['Summary']);
    exportData.push(['Total Activities', patientActivities.length]);
    exportData.push(['Total Duration (Minutes)', patientActivities.reduce((sum, a) => sum + a.duration_minutes, 0).toFixed(2)]);
    exportData.push(['Total Duration (Hours)', (patientActivities.reduce((sum, a) => sum + a.duration_minutes, 0) / 60).toFixed(2)]);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Patient Detail Report');

    // Generate filename
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Patient_Detail_Report_${selectedPatient.first_name}_${selectedPatient.last_name}_${currentDate}.xlsx`;

    // Save the file
    XLSX.writeFile(wb, filename);
  };

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
            <button
              onClick={() => navigate('/patient-detail-report')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              Patient Detail Report
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