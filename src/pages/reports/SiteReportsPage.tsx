import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

      // Get medical records for all patients in the site for the selected month/year
      const patientMedicalRecords: { patient: Patient; records: MedicalRecord[] }[] = [];

      for (const patient of sitePatients) {
        if (patient.id) {
          try {
            const records = await getMedicalRecordsByPatientId(patient.id);
            // Filter records by month/year
            const filteredRecords = records.filter(record => {
              const recordDate = new Date(record.createdAt || '');
              return recordDate.getMonth() + 1 === month && recordDate.getFullYear() === year;
            });
            patientMedicalRecords.push({ patient, records: filteredRecords });
          } catch (err) {
            console.error(`Error fetching records for patient ${patient.id}:`, err);
            // Continue with other patients if one fails
            patientMedicalRecords.push({ patient, records: [] });
          }
        }
      }

      // Calculate statistics
      const stats = calculateSiteStatistics(patientMedicalRecords);
      setReportData(stats);

    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSiteStatistics = (patientRecords: { patient: Patient; records: MedicalRecord[] }[]): SiteReportData => {
    const stats: SiteReportData = {
      siteName: selectedSite,
      medRecComplete: { yes: 0, no: 0, total: 0, percentage: 0 },
      bpAtGoal: { yes: 0, no: 0, total: 0, percentage: 0 },
      hospitalVisitSinceLastReview: { yes: 0, no: 0, total: 0, percentage: 0 },
      a1cAtGoal: { yes: 0, no: 0, total: 0, percentage: 0 },
      fallSinceLastVisit: { yes: 0, no: 0, total: 0, percentage: 0 },
      useBenzo: { yes: 0, no: 0, total: 0, percentage: 0 },
      useOpioids: { yes: 0, no: 0, total: 0, percentage: 0 },
      useAntipsychotic: { yes: 0, no: 0, total: 0, percentage: 0 },
    };

    patientRecords.forEach(({ patient, records }) => {
      // Use the latest record for this month, or patient's current status
      const latestRecord = records.length > 0 ? records[records.length - 1] : null;

      // Medical Records Complete
      const medRecValue = latestRecord?.medical_records ?? patient.medical_records ?? false;
      if (medRecValue) stats.medRecComplete.yes++;
      else stats.medRecComplete.no++;
      stats.medRecComplete.total++;

      // BP at Goal
      const bpValue = latestRecord?.bpAtGoal ?? patient.bp_at_goal ?? false;
      if (bpValue) stats.bpAtGoal.yes++;
      else stats.bpAtGoal.no++;
      stats.bpAtGoal.total++;

      // Hospital Visit Since Last Review
      const hospitalValue = latestRecord?.hospitalVisitSinceLastReview ?? patient.hospital_visited_since_last_review ?? false;
      if (hospitalValue) stats.hospitalVisitSinceLastReview.yes++;
      else stats.hospitalVisitSinceLastReview.no++;
      stats.hospitalVisitSinceLastReview.total++;

      // A1C at Goal
      const a1cValue = latestRecord?.a1cAtGoal ?? patient.a1c_at_goal ?? false;
      if (a1cValue) stats.a1cAtGoal.yes++;
      else stats.a1cAtGoal.no++;
      stats.a1cAtGoal.total++;

      // Fall Since Last Visit
      const fallValue = latestRecord?.fallSinceLastVisit ?? patient.fall_since_last_visit ?? false;
      if (fallValue) stats.fallSinceLastVisit.yes++;
      else stats.fallSinceLastVisit.no++;
      stats.fallSinceLastVisit.total++;

      // Use Benzo
      const benzoValue = latestRecord?.benzodiazepines ?? patient.use_benzo ?? false;
      if (benzoValue) stats.useBenzo.yes++;
      else stats.useBenzo.no++;
      stats.useBenzo.total++;

      // Use Opioids
      const opioidsValue = latestRecord?.opioids ?? patient.use_opioids ?? false;
      if (opioidsValue) stats.useOpioids.yes++;
      else stats.useOpioids.no++;
      stats.useOpioids.total++;

      // Use Antipsychotic
      const antipsychoticValue = latestRecord?.antipsychotics ?? patient.use_antipsychotic ?? false;
      if (antipsychoticValue) stats.useAntipsychotic.yes++;
      else stats.useAntipsychotic.no++;
      stats.useAntipsychotic.total++;
    });

    // Calculate percentages
    Object.keys(stats).forEach(key => {
      if (key !== 'siteName' && key !== 'siteId') {
        const stat = stats[key as keyof Omit<SiteReportData, 'siteName' | 'siteId'>] as { yes: number; no: number; total: number; percentage: number };
        stat.percentage = stat.total > 0 ? (stat.yes / stat.total) * 100 : 0;
      }
    });

    return stats;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Site Report</h1>
          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            Overall Reports
          </button>
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