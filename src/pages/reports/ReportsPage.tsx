import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getSites } from '../../services/siteService';
import { getMedicalRecordsByPatientId } from '../../services/medicalRecordService';
import { getPatients } from '../../services/patientService';
import type { Site } from '../../services/siteService';
import type { Patient } from '../../services/patientService';
import type { MedicalRecord } from '../../services/medicalRecordService';

interface SiteStatistics {
  siteName: string;
  yes: number;
  no: number;
  total: number;
  percentage: number;
}

interface CriteriaData {
  criteriaName: string;
  sites: SiteStatistics[];
  total: SiteStatistics;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

const ReportsPage = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(currentYear);
  const [isLoading, setIsLoading] = useState(false);
  const [criteriaData, setCriteriaData] = useState<CriteriaData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleRunReports();
  }, [month, year]);

  const handleRunReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all sites and patients
      const sites = await getSites();
      const allPatients = await getPatients();

      // Process data for each site
      const siteDataMap = new Map<string, {
        medRecComplete: { yes: number; no: number; total: number };
        bpAtGoal: { yes: number; no: number; total: number };
        hospitalVisitSinceLastReview: { yes: number; no: number; total: number };
        a1cAtGoal: { yes: number; no: number; total: number };
        fallSinceLastVisit: { yes: number; no: number; total: number };
        useBenzo: { yes: number; no: number; total: number };
        useOpioids: { yes: number; no: number; total: number };
        useAntipsychotic: { yes: number; no: number; total: number };
      }>();

      // Initialize site data
      sites.forEach(site => {
        siteDataMap.set(site.name, {
          medRecComplete: { yes: 0, no: 0, total: 0 },
          bpAtGoal: { yes: 0, no: 0, total: 0 },
          hospitalVisitSinceLastReview: { yes: 0, no: 0, total: 0 },
          a1cAtGoal: { yes: 0, no: 0, total: 0 },
          fallSinceLastVisit: { yes: 0, no: 0, total: 0 },
          useBenzo: { yes: 0, no: 0, total: 0 },
          useOpioids: { yes: 0, no: 0, total: 0 },
          useAntipsychotic: { yes: 0, no: 0, total: 0 },
        });
      });

      // For each site, process patients and their current medical status
      for (const site of sites) {
        const sitePatients = allPatients.filter(patient => patient.site_name === site.name);
        const siteStats = siteDataMap.get(site.name)!;

        // Set total to the number of patients at this site
        siteStats.medRecComplete.total = sitePatients.length;
        siteStats.bpAtGoal.total = sitePatients.length;
        siteStats.hospitalVisitSinceLastReview.total = sitePatients.length;
        siteStats.a1cAtGoal.total = sitePatients.length;
        siteStats.fallSinceLastVisit.total = sitePatients.length;
        siteStats.useBenzo.total = sitePatients.length;
        siteStats.useOpioids.total = sitePatients.length;
        siteStats.useAntipsychotic.total = sitePatients.length;

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
                if (mostRecentRecord.medical_records) siteStats.medRecComplete.yes++;
                else siteStats.medRecComplete.no++;

                if (mostRecentRecord.bpAtGoal) siteStats.bpAtGoal.yes++;
                else siteStats.bpAtGoal.no++;

                if (mostRecentRecord.hospitalVisitSinceLastReview) siteStats.hospitalVisitSinceLastReview.yes++;
                else siteStats.hospitalVisitSinceLastReview.no++;

                if (mostRecentRecord.a1cAtGoal) siteStats.a1cAtGoal.yes++;
                else siteStats.a1cAtGoal.no++;

                if (mostRecentRecord.fallSinceLastVisit) siteStats.fallSinceLastVisit.yes++;
                else siteStats.fallSinceLastVisit.no++;

                if (mostRecentRecord.benzodiazepines) siteStats.useBenzo.yes++;
                else siteStats.useBenzo.no++;

                if (mostRecentRecord.opioids) siteStats.useOpioids.yes++;
                else siteStats.useOpioids.no++;

                if (mostRecentRecord.antipsychotics) siteStats.useAntipsychotic.yes++;
                else siteStats.useAntipsychotic.no++;
              } else {
                // If no records exist, count as no for all criteria
                siteStats.medRecComplete.no++;
                siteStats.bpAtGoal.no++;
                siteStats.hospitalVisitSinceLastReview.no++;
                siteStats.a1cAtGoal.no++;
                siteStats.fallSinceLastVisit.no++;
                siteStats.useBenzo.no++;
                siteStats.useOpioids.no++;
                siteStats.useAntipsychotic.no++;
              }
            } catch (err) {
              console.error(`Error fetching records for patient ${patient.id}:`, err);
              // If there's an error, count as no for all criteria
              siteStats.medRecComplete.no++;
              siteStats.bpAtGoal.no++;
              siteStats.hospitalVisitSinceLastReview.no++;
              siteStats.a1cAtGoal.no++;
              siteStats.fallSinceLastVisit.no++;
              siteStats.useBenzo.no++;
              siteStats.useOpioids.no++;
              siteStats.useAntipsychotic.no++;
            }
          }
        }
      }

      // Convert to CriteriaData format
      const criteriaList: CriteriaData[] = [
        {
          criteriaName: 'A1C at Goal',
          sites: Array.from(siteDataMap.entries()).map(([siteName, data]) => ({
            siteName,
            yes: data.a1cAtGoal.yes,
            no: data.a1cAtGoal.no,
            total: data.a1cAtGoal.total,
            percentage: data.a1cAtGoal.total > 0 ? (data.a1cAtGoal.yes / data.a1cAtGoal.total) * 100 : 0
          })),
          total: { siteName: 'All', yes: 0, no: 0, total: 0, percentage: 0 }
        },
        {
          criteriaName: 'BP at Goal',
          sites: Array.from(siteDataMap.entries()).map(([siteName, data]) => ({
            siteName,
            yes: data.bpAtGoal.yes,
            no: data.bpAtGoal.no,
            total: data.bpAtGoal.total,
            percentage: data.bpAtGoal.total > 0 ? (data.bpAtGoal.yes / data.bpAtGoal.total) * 100 : 0
          })),
          total: { siteName: 'All', yes: 0, no: 0, total: 0, percentage: 0 }
        },
        {
          criteriaName: 'Med Rec Complete',
          sites: Array.from(siteDataMap.entries()).map(([siteName, data]) => ({
            siteName,
            yes: data.medRecComplete.yes,
            no: data.medRecComplete.no,
            total: data.medRecComplete.total,
            percentage: data.medRecComplete.total > 0 ? (data.medRecComplete.yes / data.medRecComplete.total) * 100 : 0
          })),
          total: { siteName: 'All', yes: 0, no: 0, total: 0, percentage: 0 }
        },
        {
          criteriaName: 'Hospital Visit Since Last Review',
          sites: Array.from(siteDataMap.entries()).map(([siteName, data]) => ({
            siteName,
            yes: data.hospitalVisitSinceLastReview.yes,
            no: data.hospitalVisitSinceLastReview.no,
            total: data.hospitalVisitSinceLastReview.total,
            percentage: data.hospitalVisitSinceLastReview.total > 0 ? (data.hospitalVisitSinceLastReview.yes / data.hospitalVisitSinceLastReview.total) * 100 : 0
          })),
          total: { siteName: 'All', yes: 0, no: 0, total: 0, percentage: 0 }
        },
        {
          criteriaName: 'Fall Since Last Visit',
          sites: Array.from(siteDataMap.entries()).map(([siteName, data]) => ({
            siteName,
            yes: data.fallSinceLastVisit.yes,
            no: data.fallSinceLastVisit.no,
            total: data.fallSinceLastVisit.total,
            percentage: data.fallSinceLastVisit.total > 0 ? (data.fallSinceLastVisit.yes / data.fallSinceLastVisit.total) * 100 : 0
          })),
          total: { siteName: 'All', yes: 0, no: 0, total: 0, percentage: 0 }
        },
        {
          criteriaName: 'Use Benzo',
          sites: Array.from(siteDataMap.entries()).map(([siteName, data]) => ({
            siteName,
            yes: data.useBenzo.yes,
            no: data.useBenzo.no,
            total: data.useBenzo.total,
            percentage: data.useBenzo.total > 0 ? (data.useBenzo.yes / data.useBenzo.total) * 100 : 0
          })),
          total: { siteName: 'All', yes: 0, no: 0, total: 0, percentage: 0 }
        },
        {
          criteriaName: 'Use Opioids',
          sites: Array.from(siteDataMap.entries()).map(([siteName, data]) => ({
            siteName,
            yes: data.useOpioids.yes,
            no: data.useOpioids.no,
            total: data.useOpioids.total,
            percentage: data.useOpioids.total > 0 ? (data.useOpioids.yes / data.useOpioids.total) * 100 : 0
          })),
          total: { siteName: 'All', yes: 0, no: 0, total: 0, percentage: 0 }
        },
        {
          criteriaName: 'Use Antipsychotic',
          sites: Array.from(siteDataMap.entries()).map(([siteName, data]) => ({
            siteName,
            yes: data.useAntipsychotic.yes,
            no: data.useAntipsychotic.no,
            total: data.useAntipsychotic.total,
            percentage: data.useAntipsychotic.total > 0 ? (data.useAntipsychotic.yes / data.useAntipsychotic.total) * 100 : 0
          })),
          total: { siteName: 'All', yes: 0, no: 0, total: 0, percentage: 0 }
        }
      ];

      // Calculate totals for each criteria
      criteriaList.forEach(criteria => {
        criteria.total = criteria.sites.reduce((acc, site) => ({
          siteName: 'All',
          yes: acc.yes + site.yes,
          no: acc.no + site.no,
          total: acc.total + site.total,
          percentage: 0
        }), { siteName: 'All', yes: 0, no: 0, total: 0, percentage: 0 });

        criteria.total.percentage = criteria.total.total > 0 ? (criteria.total.yes / criteria.total.total) * 100 : 0;
      });

      setCriteriaData(criteriaList);

    } catch (err) {
      console.error('Error generating reports:', err);
      setError('Failed to generate reports');
    } finally {
      setIsLoading(false);
    }
  };

  // Export function for overall reports
  const handleExportData = () => {
    console.log('Export function called', { criteriaDataLength: criteriaData.length });
    
    if (criteriaData.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      console.log('Starting export process...');
      
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Get all unique site names from the first criteria
      const siteNames = criteriaData[0]?.sites.map(site => site.siteName) || [];

      // Create comprehensive data that matches the screen layout
      const exportData: (string | number)[][] = [];
      
      // Add title rows at the very top, above table headers
      exportData.push(['Overall Outcomes Report']);
      exportData.push([`Month: ${month}, Year: ${year}`]);
      exportData.push(['']); // Empty row for spacing
      
      // Add table headers
      const headerRow: (string | number)[] = ['Criteria', ...siteNames, 'All Sites'];
      exportData.push(headerRow);

      // For each criteria, create rows for Yes, No, Total, and Percentage
      criteriaData.forEach(criteria => {
        // Criteria header
        const criteriaHeaderRow: (string | number)[] = [criteria.criteriaName, ...siteNames.map(() => ''), ''];
        exportData.push(criteriaHeaderRow);

        // Yes row
        const yesRow: (string | number)[] = ['Yes'];
        criteria.sites.forEach(site => {
          yesRow.push(site.yes);
        });
        yesRow.push(criteria.total.yes);
        exportData.push(yesRow);

        // No row
        const noRow: (string | number)[] = ['No'];
        criteria.sites.forEach(site => {
          noRow.push(site.no);
        });
        noRow.push(criteria.total.no);
        exportData.push(noRow);

        // Total row
        const totalRow: (string | number)[] = ['Total'];
        criteria.sites.forEach(site => {
          totalRow.push(site.total);
        });
        totalRow.push(criteria.total.total);
        exportData.push(totalRow);

        // Percentage row
        const percentageRow: (string | number)[] = ['Percentage'];
        criteria.sites.forEach(site => {
          percentageRow.push(site.percentage.toFixed(4) + '%');
        });
        percentageRow.push(criteria.total.percentage.toFixed(4) + '%');
        exportData.push(percentageRow);

        // Empty row for spacing between criteria
        exportData.push(['', ...siteNames.map(() => ''), '']);
      });

      // Create worksheet from array of arrays instead of JSON
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Overall Outcomes');

      // Generate filename with current date and filters
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Overall_Outcomes_${month}_${year}_${currentDate}.xlsx`;

      // Save the file
      console.log('About to save file:', filename);
      XLSX.writeFile(wb, filename);
      console.log('File saved successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with title and Site Reports button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Overall Outcomes</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExportData}
              disabled={isLoading || criteriaData.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Data
            </button>
            <button
              onClick={() => navigate('/site-reports')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              Site Reports
            </button>
            <button
              onClick={() => navigate('/patient-reports')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              Patient Reports
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
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <div className="relative">
                  <select
                    id="month"
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
                    id="year"
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
            <p className="mt-2 text-gray-600">Generating reports...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Report Tables */}
        {!isLoading && criteriaData.length > 0 && (
          <div className="space-y-8">
            {criteriaData.map((criteria, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">{criteria.criteriaName}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Site
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
                      {criteria.sites.map((site, siteIndex) => (
                        <tr key={siteIndex}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {site.siteName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {site.yes}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {site.no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {site.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {site.percentage.toFixed(4)} %
                          </td>
                        </tr>
                      ))}
                      {criteria.total.total > 0 && (
                        <tr className="bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            All
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {criteria.total.yes}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {criteria.total.no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {criteria.total.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {criteria.total.percentage.toFixed(4)} %
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
      </div>
    </div>
  );
};

export default ReportsPage;