import React, { useState, useEffect } from 'react';
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { getActivities } from '../../services/activityService';
import type { Activity } from '../../services/patientService';
import { useNavigate } from 'react-router-dom';

const sites = ['CP Greater San Antonio', 'CP Intermountain'];
const months = [1,2,3,4,5,6,7,8,9,10,11,12];
const years = [2023, 2024, 2025];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MedicalActivitiesPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState(sites[0]);
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const data = await getActivities({
          site: siteFilter,
          month: monthFilter,
          year: yearFilter,
          search: searchTerm
        });
        setActivities(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [siteFilter, monthFilter, yearFilter, searchTerm]);

  // Filtering and sorting
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      (activity.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      String(activity.id).includes(searchTerm);
    return matchesSearch;
  });

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    let aValue: any = a[sortField as keyof typeof a];
    let bValue: any = b[sortField as keyof typeof b];
    
    // Handle special cases for sorting
    if (sortField === 'recordDate') {
      aValue = a.service_datetime || '';
      bValue = b.service_datetime || '';
    } else if (sortField === 'totalTime') {
      aValue = a.time_spent || a.duration_minutes || 0;
      bValue = b.time_spent || b.duration_minutes || 0;
    } else if (sortField === 'pharm') {
      aValue = a.is_pharmacist || a.pharm_flag || false;
      bValue = b.is_pharmacist || b.pharm_flag || false;
    }

    // Handle undefined values
    if (aValue === undefined) aValue = '';
    if (bValue === undefined) bValue = '';

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Get initials from name
  const getInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Helper function to convert time to number
  const getTimeValue = (activity: Activity): number => {
    const timeSpent = typeof activity.time_spent === 'number' ? activity.time_spent : 0;
    const durationMinutes = typeof activity.duration_minutes === 'number' ? activity.duration_minutes : 0;
    return timeSpent || durationMinutes || 0;
  };

  const handlePatientClick = (patientId: string) => {
    navigate(`/patientdetails/${patientId}`);
  };

  const handleActivityClick = (activityId: string) => {
    navigate(`/activity/${activityId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Medical Activities</h1>
        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col space-y-4">
            {/* Top row with search */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center">
                <div className="text-lg font-semibold text-gray-800">
                  Total Activities: <span className="text-blue-600">{activities.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>
            {/* Filter dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <div className="relative">
                  <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border appearance-none"
                  >
                    {sites.map((site) => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <div className="relative">
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(Number(e.target.value))}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border appearance-none"
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>{monthNames[month-1]}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <div className="relative">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(Number(e.target.value))}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border appearance-none"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading activities...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('id')}>
                      <div className="flex items-center">
                        <span>Activity #</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon className={`h-3 w-3 ${sortField === 'id' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                          <ArrowDownIcon className={`h-3 w-3 ${sortField === 'id' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('patient_name')}>
                      <div className="flex items-center">
                        <span>Name</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon className={`h-3 w-3 ${sortField === 'patient_name' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                          <ArrowDownIcon className={`h-3 w-3 ${sortField === 'patient_name' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span>Initials</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('pharm')}>
                      <div className="flex items-center">
                        <span>Pharm?</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon className={`h-3 w-3 ${sortField === 'pharm' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                          <ArrowDownIcon className={`h-3 w-3 ${sortField === 'pharm' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('recordDate')}>
                      <div className="flex items-center">
                        <span>Record Date</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon className={`h-3 w-3 ${sortField === 'recordDate' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                          <ArrowDownIcon className={`h-3 w-3 ${sortField === 'recordDate' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('totalTime')}>
                      <div className="flex items-center">
                        <span>Total Time</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon className={`h-3 w-3 ${sortField === 'totalTime' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                          <ArrowDownIcon className={`h-3 w-3 ${sortField === 'totalTime' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedActivities.length > 0 ? (
                    sortedActivities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-900 hover:underline"
                          onClick={() => handleActivityClick(activity.id.toString())}
                        >
                          {activity.id}
                        </td>
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-900 hover:underline"
                          onClick={() => activity.patient_id && handlePatientClick(activity.patient_id.toString())}
                        >
                          {activity.patient_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">LG</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.is_pharmacist || activity.pharm_flag ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.service_datetime)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTimeValue(activity).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No activities found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalActivitiesPage; 