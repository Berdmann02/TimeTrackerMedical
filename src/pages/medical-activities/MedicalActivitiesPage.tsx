import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, SearchIcon, Plus, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { getActivitiesWithDetails } from '../../services/activityService';
import { getSitesAndBuildings } from '../../services/siteService';
import AddActivityModal from '../../components/AddActivityModal';

// Add missing type definitions
interface SiteWithBuildings {
  site_name: string;
  building_names: string[];
}

// Enrich the Activity type with additional fields from the backend
interface EnrichedActivity {
  id: number;
  patient_id: number; // Changed to number to match backend
  user_id: number;  // Changed to number to match backend
  activity_type: string;
  pharm_flag?: boolean;
  notes?: string;
  site_name: string;
  building?: string;
  service_datetime: string; // Keep as string to match backend
  duration_minutes: number;
  created_at?: string; // Keep as string to match backend
  patient_name: string;
  user_initials: string;
  building_name?: string;
  time_spent?: number;
}

// Constants
const months = ['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const monthNames = [
  'All', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MedicalActivitiesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('All');
  const [buildingFilter, setBuildingFilter] = useState('All');
  
  // State for sites and buildings data
  const [sitesAndBuildings, setSitesAndBuildings] = useState<SiteWithBuildings[]>([]);
  
  // Get current date for retrieving available years
  const currentDate = new Date();
  
  const [monthFilter, setMonthFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activities, setActivities] = useState<EnrichedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get unique years from activities
  const availableYears = useMemo(() => {
    const years = activities
      .map(activity => {
        const date = activity.service_datetime || activity.created_at;
        if (!date) return null;
        const year = new Date(date).getFullYear();
        return isNaN(year) ? null : year;
      })
      .filter((year): year is number => year !== null);
    
    // Get unique years and sort in ascending order
    const uniqueYears = Array.from(new Set(years)).sort((a, b) => a - b);
    
    // If no years available, include current year
    if (uniqueYears.length === 0) {
      uniqueYears.push(currentDate.getFullYear());
    }
    
    return uniqueYears;
  }, [activities]);

  // Helper function to safely create a Date
  const getDateValue = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  // Fetch sites and buildings data in the background
  const fetchSitesAndBuildingsData = async () => {
    try {
      const data = await getSitesAndBuildings();
      setSitesAndBuildings(data);
    } catch (err) {
      console.error('Error fetching sites and buildings:', err);
    }
  };

  // Get all unique site names
  const siteNames = useMemo(() => {
    return sitesAndBuildings.map(site => site.site_name);
  }, [sitesAndBuildings]);

  // Get all buildings (filtered by selected site if applicable)
  const availableBuildings = useMemo(() => {
    if (siteFilter === "All") {
      // Show all buildings from all sites, but remove duplicates
      const allBuildings = sitesAndBuildings.flatMap(site => site.building_names).filter(Boolean);
      return [...new Set(allBuildings)]; // Remove duplicates
    } else {
      // Show only buildings for the selected site
      const selectedSiteData = sitesAndBuildings.find(site => site.site_name === siteFilter);
      return selectedSiteData ? selectedSiteData.building_names : [];
    }
  }, [sitesAndBuildings, siteFilter]);

  // Reset building filter when site filter changes
  useEffect(() => {
    setBuildingFilter("All");
  }, [siteFilter]);

  // Fetch all activities and their associated patient names
  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const activitiesData = await getActivitiesWithDetails() as EnrichedActivity[];
      
      setActivities(activitiesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    fetchSitesAndBuildingsData();
  }, []);

  // Format date
  const formatDate = (dateStr?: string | Date): string => {
    if (!dateStr) return 'N/A';
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  // Format time spent
  const formatTimeSpent = (activity: EnrichedActivity) => {
    const timeSpent = activity.time_spent;
    const durationMinutes = activity.duration_minutes;
    
    let totalMinutes = 0;
    
    if (timeSpent !== undefined && timeSpent !== null && !isNaN(Number(timeSpent))) {
      totalMinutes = Number(timeSpent);
    } else if (durationMinutes !== undefined && durationMinutes !== null && !isNaN(Number(durationMinutes))) {
      totalMinutes = Number(durationMinutes);
    } else {
      return 'N/A';
    }
    
    if (totalMinutes === 0) return "0.00 minutes";
    
    // If less than 1 minute, show as decimal minutes (seconds converted to decimal)
    if (totalMinutes < 1) {
      const decimalMinutes = Math.round(totalMinutes * 100) / 100;
      return `${decimalMinutes.toFixed(2)} minutes`;
    }
    
    // If less than 60 minutes, show as decimal minutes
    if (totalMinutes < 60) {
      const decimalMinutes = Math.round(totalMinutes * 100) / 100;
      return `${decimalMinutes.toFixed(2)} minutes`;
    }
    
    // If 60 minutes or more, show as decimal hours
    const decimalHours = Math.round((totalMinutes / 60) * 100) / 100;
    return `${decimalHours.toFixed(2)} hours`;
  };

  // Filtering and sorting
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      (activity.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      String(activity.id).includes(searchTerm);
    
    // Filter by site if needed
    const matchesSite = siteFilter === 'All' || activity.site_name === siteFilter;
    
    // Filter by building if needed
    const matchesBuilding = buildingFilter === 'All' || 
      activity.building === buildingFilter || 
      activity.building_name === buildingFilter;
    
    // Filter by date if needed
    const dateStr = activity.service_datetime || activity.created_at;
    if (!dateStr) return matchesSearch && matchesSite && matchesBuilding;
    
    const activityDate = new Date(dateStr);
    if (isNaN(activityDate.getTime())) return matchesSearch && matchesSite && matchesBuilding;
    
    const matchesMonth = monthFilter === 'All' || activityDate.getMonth() + 1 === Number(monthFilter);
    const matchesYear = yearFilter === 'All' || activityDate.getFullYear() === Number(yearFilter);

    return matchesSearch && matchesSite && matchesBuilding && matchesMonth && matchesYear;
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
    await fetchActivities();
  };

  // Add navigation handlers
  const handleActivityClick = (activityId: number) => {
    navigate(`/activity/${activityId}`);
  };

  const handlePatientClick = (patientId: number) => {
    navigate(`/patientdetails/${patientId}`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-6 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Header with title and Add Activity button */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">Medical Activities</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex-shrink-0">
          <div className="flex flex-col space-y-3">
            {/* Top row with search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
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

            {/* Filter dropdowns - more compact layout */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Site</label>
                <div className="relative">
                  <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="All">All Sites</option>
                    {siteNames.map((site) => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Building</label>
                <div className="relative">
                  <select
                    value={buildingFilter}
                    onChange={(e) => setBuildingFilter(e.target.value)}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="All">All Buildings</option>
                    {availableBuildings.map((building) => (
                      <option key={building} value={building}>{building}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <div className="relative">
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="All">All Months</option>
                    {months.slice(1).map((month, index) => (
                      <option key={month} value={month}>{monthNames[index + 1]}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <div className="relative">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="All">All Years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4 flex-shrink-0">
            <p>{error}</p>
            <button 
              onClick={fetchActivities} 
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 flex justify-center items-center max-h-[60vh]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <div className="text-gray-500">Loading activities data...</div>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col max-h-[60vh] min-h-0">
            <div className="flex-1 overflow-auto min-h-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center">
                        <span>Activity #</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === 'id' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === 'id' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('patient_name')}
                    >
                      <div className="flex items-center">
                        <span>Patient Name</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === 'patient_name' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === 'patient_name' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('activity_type')}
                    >
                      <div className="flex items-center">
                        <span>Activity Type</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === 'activity_type' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === 'activity_type' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('user_initials')}
                    >
                      <div className="flex items-center">
                        <span>Initials</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === 'user_initials' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === 'user_initials' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('service_datetime')}
                    >
                      <div className="flex items-center">
                        <span>Record Date</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === 'service_datetime' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === 'service_datetime' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('duration_minutes')}
                    >
                      <div className="flex items-center">
                        <span>Total Time</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === 'duration_minutes' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === 'duration_minutes' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedActivities.map((activity) => (
                    <tr 
                      key={activity.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleActivityClick(activity.id)}
                          className="inline-flex items-center px-2 py-1 rounded text-blue-600 hover:text-blue-900 hover:underline transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {activity.id}
                        </button>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientClick(activity.patient_id);
                          }}
                          className="inline-flex items-center px-2 py-1 rounded text-blue-600 hover:text-blue-900 hover:underline transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {activity.patient_name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.activity_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.user_initials || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(activity.service_datetime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeSpent(activity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="flex-shrink-0 bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Previous
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{sortedActivities.length}</span> of{" "}
                    <span className="font-medium">{sortedActivities.length}</span> results
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Scroll to view more activities
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onActivityAdded={handleActivityAdded}
        siteName={siteFilter === 'All' ? (sitesAndBuildings.length > 1 ? sitesAndBuildings[1].site_name : 'CP Greater San Antonio') : siteFilter}
      />
    </div>
  );
};

export default MedicalActivitiesPage;
