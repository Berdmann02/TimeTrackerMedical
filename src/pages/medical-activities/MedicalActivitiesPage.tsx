import React, { useState, useEffect } from 'react';
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, SearchIcon, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddActivityModal from '../../components/AddActivityModal';
import { getActivityTypes, getActivityById, getActivitiesWithDetails } from '../../services/activityService';
import type { Activity } from '../../services/patientService';
import { getSites, type Site } from '../../services/siteService';
import { getBuildingsWithSiteInfo, type BuildingWithSiteInfo } from '../../services/buildingService';

// Remove mock data and replace with state
const months = ['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const years = ['All', '2023', '2024', '2025'];

const monthNames = [
  'All', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface ActivityWithPatient extends Activity {
  patient_name?: string;
  user_initials?: string;
  site_name?: string;
  building_name?: string;
  building_id?: number;
}

const MedicalActivitiesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('All');
  const [buildingFilter, setBuildingFilter] = useState('All');
  
  // Update state to use proper Site and BuildingWithSiteInfo interfaces
  const [sites, setSites] = useState<Site[]>([]);
  const [buildings, setBuildings] = useState<BuildingWithSiteInfo[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  
  // Get current date for default filters
  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString(); // getMonth() returns 0-11, so add 1
  const currentYear = currentDate.getFullYear().toString();
  
  const [monthFilter, setMonthFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityWithPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely create a Date
  const getDateValue = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  // Fetch sites data
  const fetchSitesData = async () => {
    setIsLoadingSites(true);
    try {
      const data = await getSites();
      setSites(data.filter(site => site.is_active));
    } catch (err) {
      console.error('Error fetching sites:', err);
    } finally {
      setIsLoadingSites(false);
    }
  };

  // Fetch buildings data for selected site
  const fetchBuildingsData = async (siteName: string) => {
    setIsLoadingBuildings(true);
    try {
      const data = await getBuildingsWithSiteInfo();
      
      if (siteName === "All") {
        // Show all buildings when "All Sites" is selected
        setBuildings(data.filter(building => building.is_active));
      } else {
        // Show only buildings for the selected site
        const filteredBuildings = data.filter(building => 
          building.is_active && building.site_name === siteName
        );
        setBuildings(filteredBuildings);
      }
    } catch (err) {
      console.error('Error fetching buildings:', err);
    } finally {
      setIsLoadingBuildings(false);
    }
  };

  // Fetch all activities and their associated patient names
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const activitiesData = await getActivitiesWithDetails();

        // Data already includes patient names and user initials from the backend join
        setActivities(activitiesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
    fetchSitesData();
  }, []);

  // Load buildings when site filter changes
  useEffect(() => {
    fetchBuildingsData(siteFilter);
  }, [siteFilter]);

  // Format time spent
  const formatTimeSpent = (activity: ActivityWithPatient) => {
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
    
    if (totalMinutes === 0) return "0 minutes";
    
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.round((totalMinutes - minutes) * 60);
    
    if (minutes === 0) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else if (seconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  };

  // Filtering and sorting
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      (activity.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      String(activity.id).includes(searchTerm);
    
    // Filter by site if needed
    const matchesSite = siteFilter === 'All' || activity.site_name === siteFilter;
    
    // Filter by building if needed
    const matchesBuilding = buildingFilter === 'All' || activity.building_name === buildingFilter;
    
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
    try {
      const activitiesData = await getActivitiesWithDetails();
      
      // Data already includes patient names and user initials from the backend join
      setActivities(activitiesData);
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
      <div className="h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <div className="flex-1 flex flex-col px-4 py-6 max-w-7xl mx-auto w-full overflow-hidden">
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

          <AddActivityModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onActivityAdded={handleActivityAdded}
            siteName={siteFilter === 'All' ? (sites.length > 1 ? sites[1].name : 'CP Greater San Antonio') : siteFilter}
          />

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
                      <option value="All">All</option>
                      {sites.map((site) => (
                        <option key={site.name} value={site.name}>{site.name}</option>
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
                      disabled={isLoadingBuildings}
                      className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="All">
                        {siteFilter === "All" 
                          ? "All Buildings" 
                          : buildings.length === 0 
                            ? `No buildings for ${siteFilter}` 
                            : "All Buildings"}
                      </option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.name}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      {isLoadingBuildings ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      ) : (
                        <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                      )}
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
                      {months.map((month, index) => (
                        <option key={month} value={month}>{monthNames[index]}</option>
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
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
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

          {/* Loading state for table */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 flex justify-center items-center max-h-[60vh]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <div className="text-gray-500">Loading activities data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <div className="flex-1 flex flex-col px-4 py-6 max-w-7xl mx-auto w-full overflow-hidden">
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

          <AddActivityModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onActivityAdded={handleActivityAdded}
            siteName={siteFilter === 'All' ? (sites.length > 1 ? sites[1].name : 'CP Greater San Antonio') : siteFilter}
          />

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
                      <option value="All">All</option>
                      {sites.map((site) => (
                        <option key={site.name} value={site.name}>{site.name}</option>
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
                      disabled={isLoadingBuildings}
                      className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="All">
                        {siteFilter === "All" 
                          ? "All Buildings" 
                          : buildings.length === 0 
                            ? `No buildings for ${siteFilter}` 
                            : "All Buildings"}
                      </option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.name}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      {isLoadingBuildings ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      ) : (
                        <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                      )}
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
                      {months.map((month, index) => (
                        <option key={month} value={month}>{monthNames[index]}</option>
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
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
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
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 max-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-semibold mb-2">Error</p>
              <p>{error}</p>
            </div>
          </div>
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
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-6 max-w-7xl mx-auto w-full overflow-hidden">
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

        <AddActivityModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onActivityAdded={handleActivityAdded}
          siteName={siteFilter === 'All' ? (sites.length > 1 ? sites[1].name : 'CP Greater San Antonio') : siteFilter}
        />

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
                    <option value="All">All</option>
                    {sites.map((site) => (
                      <option key={site.name} value={site.name}>{site.name}</option>
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
                    disabled={isLoadingBuildings}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="All">
                      {siteFilter === "All" 
                        ? "All Buildings" 
                        : buildings.length === 0 
                          ? `No buildings for ${siteFilter}` 
                          : "All Buildings"}
                    </option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.name}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    {isLoadingBuildings ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    ) : (
                      <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                    )}
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
                    {months.map((month, index) => (
                      <option key={month} value={month}>{monthNames[index]}</option>
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
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
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

        <div className="bg-white rounded-lg border border-gray-200 flex flex-col max-h-[60vh] min-h-0">
          {/* Scrollable Table with Fixed Header */}
          <div className="flex-1 overflow-auto min-h-0 table-container">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
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
                        {activity.user_initials  || 'N/A'}
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

          {/* Table Footer - Fixed */}
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
      </div>
    </div>
  );
};

export default MedicalActivitiesPage;