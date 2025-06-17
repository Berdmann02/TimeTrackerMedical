import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getSites } from '../../services/siteService';
import { getMedicalRecordsByPatientId } from '../../services/medicalRecordService';
import { getPatients } from '../../services/patientService';
import type { Site } from '../../services/siteService';
import type { Patient } from '../../services/patientService';
import type { MedicalRecord } from '../../services/medicalRecordService';

interface SiteReportData {
  siteName: string;
  siteId?: number;
  medRecComplete: { yes: number; no: number; total: number; percentage: number };
  bpAtGoal: { yes: number; no: number; total: number; percentage: number };
  hospitalVisitSinceLastReview: { yes: number; no: number; total: number; percentage: number };
  a1cAtGoal: { yes: number; no: number; total: number; percentage: number };
  fallSinceLastVisit: { yes: number; no: number; total: number; percentage: number };
  useBenzo: { yes: number; no: number; total: number; percentage: number };
  useOpioids: { yes: number; no: number; total: number; percentage: number };
  useAntipsychotic: { yes: number; no: number; total: number; percentage: number };
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const SiteReportsPage = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(currentYear);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<SiteReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchReportData();
    }
  }, [selectedSite, month, year]);

  const fetchSites = async () => {
    try {
      const sitesData = await getSites();
      setSites(sitesData);
      if (sitesData.length > 0) {
        setSelectedSite(sitesData[0].name);
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
      setError('Failed to load sites');
    }
  };

  const fetchReportData = async () => {
    if (!selectedSite) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get all patients for the selected site
      const allPatients = await getPatients();
      const sitePatients = allPatients.filter(patient => patient.site_name === selectedSite);

      if (sitePatients.length === 0) {
        setReportData({
          siteName: selectedSite,
          medRecComplete: { yes: 0, no: 0, total: 0, percentage: 0 },
          bpAtGoal: { yes: 0, no: 0, total: 0, percentage: 0 },
          hospitalVisitSinceLastReview: { yes: 0, no: 0, total: 0, percentage: 0 },
          a1cAtGoal: { yes: 0, no: 0, total: 0, percentage: 0 },
          fallSinceLastVisit: { yes: 0, no: 0, total: 0, percentage: 0 },
          useBenzo: { yes: 0, no: 0, total: 0, percentage: 0 },
          useOpioids: { yes: 0, no: 0, total: 0, percentage: 0 },
          useAntipsychotic: { yes: 0, no: 0, total: 0, percentage: 0 },
        });
        setIsLoading(false);
        return;
      }

      // Initialize statistics with total being the number of patients at the site
      const stats = {
        siteName: selectedSite,
        medRecComplete: { yes: 0, no: 0, total: sitePatients.length, percentage: 0 },
        bpAtGoal: { yes: 0, no: 0, total: sitePatients.length, percentage: 0 },
        hospitalVisitSinceLastReview: { yes: 0, no: 0, total: sitePatients.length, percentage: 0 },
        a1cAtGoal: { yes: 0, no: 0, total: sitePatients.length, percentage: 0 },
        fallSinceLastVisit: { yes: 0, no: 0, total: sitePatients.length, percentage: 0 },
        useBenzo: { yes: 0, no: 0, total: sitePatients.length, percentage: 0 },
        useOpioids: { yes: 0, no: 0, total: sitePatients.length, percentage: 0 },
        useAntipsychotic: { yes: 0, no: 0, total: sitePatients.length, percentage: 0 },
      };

      // Get the most recent medical record for each patient
      for (const patient of sitePatients) {
        if (patient.id) {
          try {
            const records = await getMedicalRecordsByPatientId(patient.id);
            if (records.length > 0) {
              // Sort records by date and get the most recent one
              const sortedRecords = records.sort((a, b) => {
                const dateA = new Date(a.createdAt || '');
                const dateB = new Date(b.createdAt || '');
                return dateB.getTime() - dateA.getTime();
              });
              const mostRecentRecord = sortedRecords[0];

              // Update statistics based on the most recent record
              // If the checkbox is checked, count as yes, otherwise no
              if (mostRecentRecord.medical_records) stats.medRecComplete.yes++;
              else stats.medRecComplete.no++;

              if (mostRecentRecord.bpAtGoal) stats.bpAtGoal.yes++;
              else stats.bpAtGoal.no++;

              if (mostRecentRecord.hospitalVisitSinceLastReview) stats.hospitalVisitSinceLastReview.yes++;
              else stats.hospitalVisitSinceLastReview.no++;

              if (mostRecentRecord.a1cAtGoal) stats.a1cAtGoal.yes++;
              else stats.a1cAtGoal.no++;

              if (mostRecentRecord.fallSinceLastVisit) stats.fallSinceLastVisit.yes++;
              else stats.fallSinceLastVisit.no++;

              if (mostRecentRecord.benzodiazepines) stats.useBenzo.yes++;
              else stats.useBenzo.no++;

              if (mostRecentRecord.opioids) stats.useOpioids.yes++;
              else stats.useOpioids.no++;

              if (mostRecentRecord.antipsychotics) stats.useAntipsychotic.yes++;
              else stats.useAntipsychotic.no++;
            } else {
              // If no records exist, count as no for all criteria
              stats.medRecComplete.no++;
              stats.bpAtGoal.no++;
              stats.hospitalVisitSinceLastReview.no++;
              stats.a1cAtGoal.no++;
              stats.fallSinceLastVisit.no++;
              stats.useBenzo.no++;
              stats.useOpioids.no++;
              stats.useAntipsychotic.no++;
            }
          } catch (err) {
            console.error(`Error fetching records for patient ${patient.id}:`, err);
            // If there's an error, count as no for all criteria
            stats.medRecComplete.no++;
            stats.bpAtGoal.no++;
            stats.hospitalVisitSinceLastReview.no++;
            stats.a1cAtGoal.no++;
            stats.fallSinceLastVisit.no++;
            stats.useBenzo.no++;
            stats.useOpioids.no++;
            stats.useAntipsychotic.no++;
          }
        }
      }

      // Calculate percentages
      Object.keys(stats).forEach(key => {
        if (key !== 'siteName' && key !== 'siteId') {
          const stat = stats[key as keyof Omit<SiteReportData, 'siteName' | 'siteId'>] as { yes: number; no: number; total: number; percentage: number };
          stat.percentage = stat.total > 0 ? (stat.yes / stat.total) * 100 : 0;
        }
      });

      setReportData(stats);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  // Export function for site reports
  const handleExportData = () => {
    if (!reportData) {
      alert('No data to export');
      return;
    }

    // Prepare data for export with title at the top
    const exportData: (string | number)[][] = [];
    
    // Add title rows at the very top, above table headers
    exportData.push([`Site Report: ${selectedSite}`]);
    exportData.push([`Month: ${month}, Year: ${year}`]);
    exportData.push(['']); // Empty row for spacing
    
    // Add table headers
    exportData.push(['Criteria', 'Yes', 'No', 'Total', 'Percentage']);
    
    // Add data rows matching the exact order and names shown on screen
    exportData.push([
      'Med Rec Complete',
      reportData.medRecComplete.yes,
      reportData.medRecComplete.no,
      reportData.medRecComplete.total,
      reportData.medRecComplete.percentage.toFixed(4) + '%'
    ]);
    exportData.push([
      'BP at Goal',
      reportData.bpAtGoal.yes,
      reportData.bpAtGoal.no,
      reportData.bpAtGoal.total,
      reportData.bpAtGoal.percentage.toFixed(4) + '%'
    ]);
    exportData.push([
      'Hospital Visit Since Last Review',
      reportData.hospitalVisitSinceLastReview.yes,
      reportData.hospitalVisitSinceLastReview.no,
      reportData.hospitalVisitSinceLastReview.total,
      reportData.hospitalVisitSinceLastReview.percentage.toFixed(4) + '%'
    ]);
    exportData.push([
      'A1C at Goal',
      reportData.a1cAtGoal.yes,
      reportData.a1cAtGoal.no,
      reportData.a1cAtGoal.total,
      reportData.a1cAtGoal.percentage.toFixed(4) + '%'
    ]);
    exportData.push([
      'Fall Since Last Visit',
      reportData.fallSinceLastVisit.yes,
      reportData.fallSinceLastVisit.no,
      reportData.fallSinceLastVisit.total,
      reportData.fallSinceLastVisit.percentage.toFixed(4) + '%'
    ]);
    exportData.push([
      'Use Benzo',
      reportData.useBenzo.yes,
      reportData.useBenzo.no,
      reportData.useBenzo.total,
      reportData.useBenzo.percentage.toFixed(4) + '%'
    ]);
    exportData.push([
      'Use Opioids',
      reportData.useOpioids.yes,
      reportData.useOpioids.no,
      reportData.useOpioids.total,
      reportData.useOpioids.percentage.toFixed(4) + '%'
    ]);
    exportData.push([
      'Use Antipsychotic',
      reportData.useAntipsychotic.yes,
      reportData.useAntipsychotic.no,
      reportData.useAntipsychotic.total,
      reportData.useAntipsychotic.percentage.toFixed(4) + '%'
    ]);

    // Create workbook and worksheet from array of arrays
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Site Report');

    // Generate filename with current date and filters
    const currentDate = new Date().toISOString().split('T')[0];
    const siteName = selectedSite.replace(/[^a-zA-Z0-9]/g, '_'); // Replace special characters for filename
    const filename = `Site_Report_${siteName}_${month}_${year}_${currentDate}.xlsx`;

    // Save the file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Site Report</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExportData}
              disabled={isLoading || !reportData}
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
              onClick={() => navigate('/patient-reports')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              Patient Reports
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Site</label>
                <div className="relative">
                  <select
                    value={selectedSite}
                    onChange={e => setSelectedSite(e.target.value)}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    {sites.map(site => (
                      <option key={site.id} value={site.name}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <div className="relative">
                  <select
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.value}</option>
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
            <p className="mt-2 text-gray-600">Loading report data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Report Table */}
        {reportData && !isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criteria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Med Rec Complete
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.medRecComplete.yes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.medRecComplete.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.medRecComplete.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.medRecComplete.percentage.toFixed(4)} %
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      BP at Goal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.bpAtGoal.yes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.bpAtGoal.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.bpAtGoal.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.bpAtGoal.percentage.toFixed(4)} %
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Hospital Visit Since Last Review
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.hospitalVisitSinceLastReview.yes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.hospitalVisitSinceLastReview.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.hospitalVisitSinceLastReview.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.hospitalVisitSinceLastReview.percentage.toFixed(4)} %
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      A1C at Goal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.a1cAtGoal.yes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.a1cAtGoal.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.a1cAtGoal.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.a1cAtGoal.percentage.toFixed(4)} %
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Fall Since Last Visit
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.fallSinceLastVisit.yes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.fallSinceLastVisit.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.fallSinceLastVisit.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.fallSinceLastVisit.percentage.toFixed(4)} %
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Use Benzo
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useBenzo.yes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useBenzo.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useBenzo.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useBenzo.percentage.toFixed(4)} %
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Use Opioids
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useOpioids.yes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useOpioids.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useOpioids.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useOpioids.percentage.toFixed(4)} %
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Use Antipsychotic
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useAntipsychotic.yes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useAntipsychotic.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useAntipsychotic.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportData.useAntipsychotic.percentage.toFixed(4)} %
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteReportsPage; 