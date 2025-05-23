import React, { useState, useEffect } from 'react';
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, SearchIcon, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddActivityModal from '../../components/AddActivityModal';
import { getActivityTypes } from '../../services/activityService';
import type { Activity } from '../../services/patientService';
import { getPatientById } from '../../services/patientService';
import axios from 'axios';
import { API_URL } from '../../config';

// Remove mock data and replace with state
const sites = ['CP Greater San Antonio', 'CP Intermountain'];
const months = [1,2,3,4,5,6,7,8,9,10,11,12];
const years = [2023, 2024, 2025];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface ActivityWithPatient extends Activity {
  patient_name?: string;
  user?: User;
}

const MedicalActivitiesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState(sites[0]);
  const [monthFilter, setMonthFilter] = useState(5);
  const [yearFilter, setYearFilter] = useState(2025);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityWithPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<Record<number, string>>({});

  // Helper function to safely create a Date
  const getDateValue = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  // Fetch all activities and their associated patient names
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/activities`);
        const activitiesData = response.data;

        // Fetch patient names and user info for each activity
        const activitiesWithInfo = await Promise.all(
          activitiesData.map(async (activity: Activity) => {
            try {
              const patient = await getPatientById(activity.patient_id);
              if (activity.user_id) {
                await fetchUserInfo(activity.user_id);
              }
              return {
                ...activity,
                patient_name: `${patient.last_name}, ${patient.first_name}`
              };
            } catch (err) {
              console.error(`Error fetching info for activity ${activity.id}:`, err);
              return {
                ...activity,
                patient_name: 'Unknown Patient'
              };
            }
          })
        );

        setActivities(activitiesWithInfo);
        setError(null);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Function to fetch user information
  const fetchUserInfo = async (userId: number) => {
    if (!userInitials[userId]) {
      try {
        const response = await axios.get(`${API_URL}/users/${userId}`);
        const user = response.data;
        const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        setUserInitials(prev => ({
          ...prev,
          [userId]: initials
        }));
      } catch (error) {
        console.error('Error fetching user:', error);
        setUserInitials(prev => ({
          ...prev,
          [userId]: 'Unknown'
        }));
      }
    }
  };

  // Format time spent
  const formatTimeSpent = (activity: ActivityWithPatient) => {
    const timeSpent = activity.time_spent;
    const durationMinutes = activity.duration_minutes;
    
    if (timeSpent !== undefined && timeSpent !== null && !isNaN(Number(timeSpent))) {
      return `${Number(timeSpent).toFixed(2)} minutes`;
    }
    
    if (durationMinutes !== undefined && durationMinutes !== null && !isNaN(Number(durationMinutes))) {
      return `${Number(durationMinutes).toFixed(2)} minutes`;
    }
    
    return 'N/A';
  };

  // Filtering and sorting
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      (activity.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      String(activity.id).includes(searchTerm);
    
    // Filter by site if needed
    const matchesSite = activity.site_name === siteFilter;
    
    // Filter by date if needed
    const dateStr = activity.service_datetime || activity.created_at;
    if (!dateStr) return false;
    
    const activityDate = new Date(dateStr);
    if (isNaN(activityDate.getTime())) return false;
    
    const matchesMonth = activityDate.getMonth() + 1 === monthFilter;
    const matchesYear = activityDate.getFullYear() === yearFilter;

    return matchesSearch && matchesSite && matchesMonth && matchesYear;
  });

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    let aValue: any = a[sortField as keyof typeof a];
    let bValue: any = b[sortField as keyof typeof b];

    // Handle dates
    if (sortField === 'service_datetime' || sortField === 'created_at') {
      aValue = getDateValue(a.service_datetime || a.created_at);
      bValue = getDateValue(b.service_datetime || b.created_at);
    }

    // Convert boolean values to strings
    if (typeof aValue === 'boolean') aValue = aValue ? '1' : '0';
    if (typeof bValue === 'boolean') bValue = bValue ? '1' : '0';

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

  const handleActivityAdded = async () => {
    try {
      const response = await axios.get(`${API_URL}/activities`);
      const newActivities = response.data;
      
      // Fetch patient names and user info for new activities
      const activitiesWithInfo = await Promise.all(
        newActivities.map(async (activity: Activity) => {
          try {
            const patient = await getPatientById(activity.patient_id);
            if (activity.user_id) {
              await fetchUserInfo(activity.user_id);
            }
            return {
              ...activity,
              patient_name: `${patient.last_name}, ${patient.first_name}`
            };
          } catch (err) {
            console.error(`Error fetching info for activity ${activity.id}:`, err);
            return {
              ...activity,
              patient_name: 'Unknown Patient'
            };
          }
        })
      );

      setActivities(activitiesWithInfo);
    } catch (err) {
      console.error('Error refreshing activities:', err);
    }
  };

  // Add navigation handlers
  const handleActivityClick = (activityId: number) => {
    navigate(`/activity/${activityId}`);
  };

  const handlePatientClick = (patientId: number) => {
    navigate(`/patientdetails/${patientId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Medical Activities</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Activity
          </button>
        </div>

        <AddActivityModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onActivityAdded={handleActivityAdded}
          siteName={siteFilter}
        />

        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col space-y-4">
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
            <div className="border-t border-gray-200 my-4"></div>
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

        <div className="bg-white rounded-lg border border-gray-200">
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
                      <span>Patient Name</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'patient_name' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'patient_name' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('activity_type')}>
                    <div className="flex items-center">
                      <span>Activity Type</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'activity_type' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'activity_type' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('user_initials')}>
                    <div className="flex items-center">
                      <span>Initials</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'user_initials' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'user_initials' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('service_datetime')}>
                    <div className="flex items-center">
                      <span>Record Date</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'service_datetime' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'service_datetime' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('time_spent')}>
                    <div className="flex items-center">
                      <span>Total Time</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'time_spent' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'time_spent' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
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
                        onClick={() => handleActivityClick(activity.id)}
                      >
                        {activity.id}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-900 hover:underline"
                        onClick={() => handlePatientClick(activity.patient_id)}
                      >
                        {activity.patient_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.activity_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.user_id ? userInitials[activity.user_id] || 'Loading...' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(activity.service_datetime || activity.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeSpent(activity)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No activities found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalActivitiesPage;