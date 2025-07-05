import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import { getSites } from '../../services/siteService';
import { getPatients } from '../../services/patientService';
import { getActivitiesByPatientId, getActivitiesWithDetails } from '../../services/activityService';
import { getBuildings } from '../../services/buildingService';
import type { Site } from '../../services/siteService';
import type { Patient } from '../../services/patientService';
import type { Activity } from '../../services/activityService';
import type { Building } from '../../services/buildingService';

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

interface ScatterData {
  x: number; // timestamp
  y: number; // duration in minutes
  activity_type: string;
  date: string;
  notes?: string;
  originalActivity: PatientDetailActivity;
}

const PatientDetailReportPage = () => {
  const navigate = useNavigate();
  
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
  const [chartType, setChartType] = useState<'line'>('line');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<PatientDetailActivity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showChart, setShowChart] = useState(false);

  // Load initial data for patient detail report
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [sitesData, buildingsData, patientsData] = await Promise.all([
          getSites(),
          getBuildings(),
          getPatients()
        ]);
        setSites(sitesData);
        setBuildings(buildingsData);
        setPatients(patientsData);
        console.log('Loaded patients:', patientsData.length);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setPatientDetailError('Failed to load initial data');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Filter buildings based on selected site
  const filteredBuildings = useMemo(() => {
    if (!buildings.length) return [];
    
    if (!selectedSite) {
      return buildings;
    }
    
    return buildings.filter(building => building.site_id === selectedSite.id);
  }, [buildings, selectedSite]);

  // Filter patients based on selected site and building
  const filteredPatients = useMemo(() => {
    if (!patients.length) return [];

    const filtered = patients.filter(patient => {
      // Filter by site
      if (selectedSite && patient.site_name !== selectedSite.name) {
        return false;
      }
      
      // Filter by building
      if (selectedBuilding && patient.building !== selectedBuilding.name) {
        return false;
      }
      
      return true;
    });

    console.log('Patient filtering:', {
      totalPatients: patients.length,
      selectedSite: selectedSite?.name,
      selectedBuilding: selectedBuilding?.name,
      filteredCount: filtered.length
    });

    return filtered;
  }, [patients, selectedSite, selectedBuilding]);

  // Clear selected patient when filters change and patient is no longer in filtered list
  useEffect(() => {
    if (selectedPatient && !filteredPatients.find(p => p.id === selectedPatient.id)) {
      setSelectedPatient(null);
    }
  }, [filteredPatients, selectedPatient]);

  // Clear building selection when site changes
  useEffect(() => {
    if (selectedSite && selectedBuilding && !filteredBuildings.find(b => b.id === selectedBuilding.id)) {
      setSelectedBuilding(null);
    }
  }, [selectedSite, selectedBuilding, filteredBuildings]);

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
      // First, let's test getting ALL activities to see what's available
      console.log('=== TESTING ACTIVITIES DATA ===');
      const allActivities = await getActivitiesWithDetails();
      console.log('Total activities in system:', allActivities.length);
      console.log('Sample activities:', allActivities.slice(0, 3));
      
      if (!selectedPatient.id) {
        setPatientDetailError('Patient ID is missing');
        return;
      }
      
      console.log('Selected patient:', selectedPatient);
      console.log('Selected patient ID:', selectedPatient.id, 'Type:', typeof selectedPatient.id);
      
      // Check if any activities exist for this patient
      const activitiesForThisPatient = allActivities.filter((activity: Activity) => activity.patient_id === selectedPatient.id);
      console.log('Activities found for this patient (from all activities):', activitiesForThisPatient.length);
      
      let filteredActivities = await getActivitiesByPatientId(selectedPatient.id);
      console.log('Activities loaded for patient (from API):', filteredActivities.length);
      console.log('Sample filtered activities:', filteredActivities.slice(0, 3));

      // Apply site filter
      if (selectedSite) {
        filteredActivities = filteredActivities.filter((activity: Activity) => 
          activity.site_name === selectedSite.name
        );
        console.log('Activities after site filter:', filteredActivities.length);
      }

      // Apply building filter
      if (selectedBuilding) {
        filteredActivities = filteredActivities.filter((activity: Activity) => 
          activity.building === selectedBuilding.name
        );
        console.log('Activities after building filter:', filteredActivities.length);
      }

      // Apply date range filter
      if (startDate) {
        filteredActivities = filteredActivities.filter((activity: Activity) => {
          const activityDate = new Date(activity.service_datetime);
          const start = new Date(startDate);
          return activityDate >= start;
        });
        console.log('Activities after start date filter:', filteredActivities.length);
      }

      if (endDate) {
        filteredActivities = filteredActivities.filter((activity: Activity) => {
          const activityDate = new Date(activity.service_datetime);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          return activityDate <= end;
        });
        console.log('Activities after end date filter:', filteredActivities.length);
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



  // Prepare scatter data for dot chart - each activity as a point
  const scatterData = useMemo(() => {
    if (!patientActivities.length) return [];

    return patientActivities.map((activity, index) => ({
      x: new Date(activity.service_datetime).getTime(), // timestamp for x-axis
      y: Number(activity.duration_minutes) || 0, // duration for y-axis
      activity_type: activity.activity_type,
      date: new Date(activity.service_datetime).toLocaleDateString(),
      notes: activity.notes,
      originalActivity: activity // Store reference to original activity
    })).sort((a, b) => a.x - b.x); // sort by timestamp
  }, [patientActivities]);

  // Handle dot click to show activity details
  const handleDotClick = (data: any) => {
    if (data && data.originalActivity) {
      setSelectedActivity(data.originalActivity);
      setShowActivityModal(true);
    }
  };

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

    const totalMinutes = patientActivities.reduce((sum, a) => sum + (Number(a.duration_minutes) || 0), 0);
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
        (Number(activity.duration_minutes) || 0).toFixed(2),
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
    exportData.push(['Total Duration (Minutes)', patientActivities.reduce((sum, a) => sum + (Number(a.duration_minutes) || 0), 0).toFixed(2)]);
    exportData.push(['Total Duration (Hours)', (patientActivities.reduce((sum, a) => sum + (Number(a.duration_minutes) || 0), 0) / 60).toFixed(2)]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patient Detail Report</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => navigate('/patient-reports')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              Patient Reports
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

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Patient</label>
                                  <select
                    value={selectedPatient?.id || ''}
                    onChange={(e) => {
                      const patient = filteredPatients.find(p => p.id === Number(e.target.value));
                      setSelectedPatient(patient || null);
                    }}
                    className="block w-full pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="">Select a patient ({filteredPatients.length} available)</option>
                    {filteredPatients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.site_name}
                      </option>
                    ))}
                  </select>
              </div>

              {/* Site Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Site (Optional)</label>
                <select
                  value={selectedSite?.id || ''}
                  onChange={(e) => {
                    const site = sites.find(s => s.id === Number(e.target.value));
                    setSelectedSite(site || null);
                  }}
                  className="block w-full pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                >
                  <option value="">All sites</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Building Selection */}
                              <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Building (Optional)</label>
                  <select
                    value={selectedBuilding?.id || ''}
                    onChange={(e) => {
                      const building = filteredBuildings.find(b => b.id === Number(e.target.value));
                      setSelectedBuilding(building || null);
                    }}
                    className="block w-full pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="">All buildings ({filteredBuildings.length} available)</option>
                    {filteredBuildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                </div>

              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date (Optional)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleGeneratePatientDetailReport}
                  disabled={isLoadingPatientDetail || !selectedPatient}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingPatientDetail ? 'Generating...' : 'Generate Report'}
                </button>
                <button
                  onClick={async () => {
                    console.log('=== QUICK TEST ===');
                    const allActivities = await getActivitiesWithDetails();
                    console.log('Total activities:', allActivities.length);
                    console.log('Sample activities:', allActivities.slice(0, 5));
                    alert(`Found ${allActivities.length} total activities. Check console for details.`);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md"
                >
                  Test Data
                </button>
              </div>
            </div>


          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading data...</p>
            </div>
          )}

          {/* Patient Detail Report Loading State */}
          {isLoadingPatientDetail && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Generating patient detail report...</p>
            </div>
          )}

          {/* Patient Detail Report Error State */}
          {patientDetailError && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{patientDetailError}</p>
              </div>
            </div>
          )}

          {/* Patient Detail Report Results */}
          {!isLoadingPatientDetail && patientActivities.length > 0 && (
            <div className="p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{patientActivities.length}</div>
                  <div className="text-sm text-blue-700">Total Activities</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {patientActivities.reduce((sum, a) => sum + (Number(a.duration_minutes) || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-green-700">Total Minutes</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {(patientActivities.reduce((sum, a) => sum + (Number(a.duration_minutes) || 0), 0) / 60).toFixed(2)}
                  </div>
                  <div className="text-sm text-purple-700">Total Hours</div>
                </div>
              </div>

              {/* Export and Print Buttons */}
              <div className="flex justify-end gap-2 mb-6">
                <button
                  onClick={handlePrintPatientDetailReport}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                >
                  Print Report
                </button>
                <button
                  onClick={handleExportPatientDetailReport}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors cursor-pointer"
                >
                  Export to Excel
                </button>
              </div>

              {/* Charts Toggle */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Activity Analysis</h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">Show Chart</span>
                    <button
                      onClick={() => setShowChart(!showChart)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        showChart ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showChart ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Charts */}
              {showChart && (
                <div className="mb-8">
                  {/* Activity Type Chart */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Activity Types by Duration</h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={scatterData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number" 
                            dataKey="x" 
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            name="Date"
                          />
                          <YAxis 
                            type="number" 
                            dataKey="y" 
                            name="Duration (minutes)"
                          />
                          <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as ScatterData;
                                return (
                                  <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                                    <p className="font-medium">{data.activity_type}</p>
                                    <p className="text-sm text-gray-600">Date: {data.date}</p>
                                    <p className="text-sm text-gray-600">Duration: {data.y} minutes</p>
                                    {data.notes && <p className="text-sm text-gray-600">Notes: {data.notes}</p>}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="y" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                            onClick={handleDotClick}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Activities Table */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration (Minutes)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Site
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Building
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {patientActivities.map((activity, index) => (
                        <tr 
                          key={index}
                          onClick={() => {
                            setSelectedActivity(activity);
                            setShowActivityModal(true);
                          }}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 underline hover:text-blue-800 hover:underline cursor-pointer">
                            {new Date(activity.service_datetime).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {activity.activity_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(Number(activity.duration_minutes) || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {activity.site_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {activity.building || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {activity.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {activity.user_initials || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!isLoadingPatientDetail && patientActivities.length === 0 && selectedPatient && !patientDetailError && (
            <div className="p-8 text-center">
              <p className="text-gray-600">No activities found for the selected patient and filters. Try adjusting your selection criteria.</p>
            </div>
          )}

          {/* Initial State */}
          {!isLoading && !selectedPatient && !patientDetailError && (
            <div className="p-8 text-center">
              <p className="text-gray-600">Please select a patient to generate a detail report.</p>
            </div>
          )}
        </div>

        {/* Activity Details Modal */}
        {showActivityModal && selectedActivity && (
          <div className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white shadow rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header Section */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Activity Details</h3>
                  <button
                    onClick={() => {
                      setShowActivityModal(false);
                      setSelectedActivity(null);
                    }}
                    className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Activity Type */}
                  <div className="flex items-start space-x-3 py-3 px-2">
                    <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0 space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Activity Type</label>
                      <p className="text-sm text-gray-900">{selectedActivity.activity_type}</p>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-start space-x-3 py-3 px-2">
                    <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0 space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Date and Time of Service</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedActivity.service_datetime).toLocaleDateString()} at{' '}
                        {new Date(selectedActivity.service_datetime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-start space-x-3 py-3 px-2">
                    <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0 space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Duration</label>
                      <p className="text-sm text-gray-900">
                        {(Number(selectedActivity.duration_minutes) || 0).toFixed(2)} minutes
                      </p>
                    </div>
                  </div>

                  {/* Site */}
                  <div className="flex items-start space-x-3 py-3 px-2">
                    <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="flex-1 min-w-0 space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Site Name</label>
                      <p className="text-sm text-gray-900">{selectedActivity.site_name}</p>
                    </div>
                  </div>

                  {/* Building */}
                  {selectedActivity.building && (
                    <div className="flex items-start space-x-3 py-3 px-2">
                      <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <div className="flex-1 min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Building</label>
                        <p className="text-sm text-gray-900">{selectedActivity.building}</p>
                      </div>
                    </div>
                  )}

                  {/* User */}
                  {selectedActivity.user_initials && (
                    <div className="flex items-start space-x-3 py-3 px-2">
                      <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div className="flex-1 min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Personnel Initials</label>
                        <p className="text-sm text-gray-900">{selectedActivity.user_initials}</p>
                      </div>
                    </div>
                  )}

                  {/* Notes - Full Width */}
                  {selectedActivity.notes && (
                    <div className="flex items-start space-x-3 py-3 px-2 lg:col-span-2">
                      <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedActivity.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowActivityModal(false);
                    setSelectedActivity(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailReportPage; 