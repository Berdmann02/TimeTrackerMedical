import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

      // Process each site's patients
      for (const site of sites) {
        const sitePatients = allPatients.filter(patient => patient.site_name === site.name);
        const siteStats = siteDataMap.get(site.name)!;

        for (const patient of sitePatients) {
          if (patient.id) {
            try {
              const records = await getMedicalRecordsByPatientId(patient.id);
              // Filter records by month/year
              const filteredRecords = records.filter(record => {
                const recordDate = new Date(record.createdAt || '');
                return recordDate.getMonth() + 1 === month && recordDate.getFullYear() === year;
              });

              // Use the latest record for this month, or patient's current status
              const latestRecord = filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1] : null;

              // Medical Records Complete
              const medRecValue = latestRecord?.medical_records ?? patient.medical_records ?? false;
              if (medRecValue) siteStats.medRecComplete.yes++;
              else siteStats.medRecComplete.no++;
              siteStats.medRecComplete.total++;

              // BP at Goal
              const bpValue = latestRecord?.bpAtGoal ?? patient.bp_at_goal ?? false;
              if (bpValue) siteStats.bpAtGoal.yes++;
              else siteStats.bpAtGoal.no++;
              siteStats.bpAtGoal.total++;

              // Hospital Visit Since Last Review
              const hospitalValue = latestRecord?.hospitalVisitSinceLastReview ?? patient.hospital_visited_since_last_review ?? false;
              if (hospitalValue) siteStats.hospitalVisitSinceLastReview.yes++;
              else siteStats.hospitalVisitSinceLastReview.no++;
              siteStats.hospitalVisitSinceLastReview.total++;

              // A1C at Goal
              const a1cValue = latestRecord?.a1cAtGoal ?? patient.a1c_at_goal ?? false;
              if (a1cValue) siteStats.a1cAtGoal.yes++;
              else siteStats.a1cAtGoal.no++;
              siteStats.a1cAtGoal.total++;

              // Fall Since Last Visit
              const fallValue = latestRecord?.fallSinceLastVisit ?? patient.fall_since_last_visit ?? false;
              if (fallValue) siteStats.fallSinceLastVisit.yes++;
              else siteStats.fallSinceLastVisit.no++;
              siteStats.fallSinceLastVisit.total++;

              // Use Benzo
              const benzoValue = latestRecord?.benzodiazepines ?? patient.use_benzo ?? false;
              if (benzoValue) siteStats.useBenzo.yes++;
              else siteStats.useBenzo.no++;
              siteStats.useBenzo.total++;

              // Use Opioids
              const opioidsValue = latestRecord?.opioids ?? patient.use_opioids ?? false;
              if (opioidsValue) siteStats.useOpioids.yes++;
              else siteStats.useOpioids.no++;
              siteStats.useOpioids.total++;

              // Use Antipsychotic
              const antipsychoticValue = latestRecord?.antipsychotics ?? patient.use_antipsychotic ?? false;
              if (antipsychoticValue) siteStats.useAntipsychotic.yes++;
              else siteStats.useAntipsychotic.no++;
              siteStats.useAntipsychotic.total++;

            } catch (err) {
              console.error(`Error fetching records for patient ${patient.id}:`, err);
              // Count patient with current status if records fail
              const medRecValue = patient.medical_records ?? false;
              if (medRecValue) siteStats.medRecComplete.yes++;
              else siteStats.medRecComplete.no++;
              siteStats.medRecComplete.total++;

              const bpValue = patient.bp_at_goal ?? false;
              if (bpValue) siteStats.bpAtGoal.yes++;
              else siteStats.bpAtGoal.no++;
              siteStats.bpAtGoal.total++;

              const hospitalValue = patient.hospital_visited_since_last_review ?? false;
              if (hospitalValue) siteStats.hospitalVisitSinceLastReview.yes++;
              else siteStats.hospitalVisitSinceLastReview.no++;
              siteStats.hospitalVisitSinceLastReview.total++;

              const a1cValue = patient.a1c_at_goal ?? false;
              if (a1cValue) siteStats.a1cAtGoal.yes++;
              else siteStats.a1cAtGoal.no++;
              siteStats.a1cAtGoal.total++;

              const fallValue = patient.fall_since_last_visit ?? false;
              if (fallValue) siteStats.fallSinceLastVisit.yes++;
              else siteStats.fallSinceLastVisit.no++;
              siteStats.fallSinceLastVisit.total++;

              const benzoValue = patient.use_benzo ?? false;
              if (benzoValue) siteStats.useBenzo.yes++;
              else siteStats.useBenzo.no++;
              siteStats.useBenzo.total++;

              const opioidsValue = patient.use_opioids ?? false;
              if (opioidsValue) siteStats.useOpioids.yes++;
              else siteStats.useOpioids.no++;
              siteStats.useOpioids.total++;

              const antipsychoticValue = patient.use_antipsychotic ?? false;
              if (antipsychoticValue) siteStats.useAntipsychotic.yes++;
              else siteStats.useAntipsychotic.no++;
              siteStats.useAntipsychotic.total++;
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

        // Don't filter out sites - show all sites even with 0 data
        // criteria.sites = criteria.sites.filter(site => site.total > 0);
      });

      setCriteriaData(criteriaList);

    } catch (err) {
      console.error('Error generating reports:', err);
      setError('Failed to generate reports');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with title and Site Reports button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Overall Outcomes</h1>
          <button
            onClick={() => navigate('/site-reports')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            Site Reports
          </button>
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
