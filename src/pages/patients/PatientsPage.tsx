import { useState, useEffect, useMemo } from "react"
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, SearchIcon, PlusIcon } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AddPatientModal from "../../components/AddPatientModal"
import AddActivityModal from "../../components/AddActivityModal"
import { getPatients, type Patient } from "../../services/patientService"
import { getSitesAndBuildings, type SiteWithBuildings } from "../../services/siteService"
import { getActivitiesByPatientId, type Activity } from "../../services/activityService"

export default function PatientsPage() {
  const navigate = useNavigate()
  const { isPharmacist, isNurse } = useAuth()
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false)
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [selectedPatientName, setSelectedPatientName] = useState<string>("")
  const [selectedPatientSite, setSelectedPatientSite] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for patients data
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientActivities, setPatientActivities] = useState<{[key: string]: Activity[]}>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [activityFilter, setActivityFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<keyof Patient | "name" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [siteFilter, setSiteFilter] = useState<string>("all")
  
  // Get current date for default filters
  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString(); // getMonth() returns 0-11, so add 1
  const currentYear = currentDate.getFullYear().toString();
  
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)
  const [buildingFilter, setBuildingFilter] = useState<string>("all")

  // State for sites and buildings data
  const [sitesAndBuildings, setSitesAndBuildings] = useState<SiteWithBuildings[]>([])

  // Fetch patients data
  const fetchPatientsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getPatients();
      setPatients(data);
      
      // Fetch activities for each patient
      const activities: { [key: string]: Activity[] } = {};
      for (const patient of data) {
        if (patient.id) {
          try {
            const patientActivities = await getActivitiesByPatientId(patient.id);
            activities[patient.id] = patientActivities;
          } catch (err) {
            console.error(`Error fetching activities for patient ${patient.id}:`, err);
            activities[patient.id] = [];
          }
        }
      }
      setPatientActivities(activities);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients. Please try again later.');
    } finally {
      setIsLoading(false);
    }
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

  // Initial data load
  useEffect(() => {
    fetchPatientsData();
    fetchSitesAndBuildingsData(); // Load in background without loading state
  }, []);

  // Get all unique site names
  const siteNames = useMemo(() => {
    return sitesAndBuildings.map(site => site.site_name);
  }, [sitesAndBuildings]);

  // Get all buildings (filtered by selected site if applicable)
  const availableBuildings = useMemo(() => {
    if (siteFilter === "all") {
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
    setBuildingFilter("all");
  }, [siteFilter]);

  // Static data for filters that don't need to be dynamic
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get all unique years from activities, but only include 2024 and 2025
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    Object.values(patientActivities).forEach(activities => {
      activities.forEach(activity => {
        const date = activity.service_datetime || activity.created_at;
        if (date) {
          const year = new Date(date).getFullYear();
          if (year >= 2024 && year <= 2025) {
            years.add(year);
          }
        }
      });
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [patientActivities]);

  // Helper to get full name from first and last name
  const getFullName = (patient: Patient) => {
    return `${patient.first_name} ${patient.last_name}`;
  };

  // Map sortField 'name' to actual field
  const getSortField = (field: typeof sortField): keyof Patient | null => {
    if (field === 'name') return 'first_name';
    return field;
  };

  // Memoized filter and sort data for better performance
  const filteredAndSortedPatients = useMemo(() => {
    // Filter patients
    const filtered = patients.filter((patient) => {
      const fullName = getFullName(patient);
      const matchesSearch =
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(patient.id).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGender = genderFilter === "all" || patient.gender === genderFilter;
      
      // Site filter
      const matchesSite = siteFilter === "all" || patient.site_name === siteFilter;
      
      // Building filter
      const matchesBuilding = buildingFilter === "all" || patient.building === buildingFilter;
      
      // Month and year filters from activities
      const patientHasActivitiesInPeriod = () => {
        if (!patient.id || monthFilter === "all" || !patientActivities[patient.id]) {
          return monthFilter === "all" && yearFilter === "all";
        }

        return patientActivities[patient.id].some(activity => {
          const activityDate = activity.service_datetime || activity.created_at;
          if (!activityDate) return false;

          const date = new Date(activityDate);
          const matchesMonth = monthFilter === "all" || 
            (date.getMonth() + 1 === Number.parseInt(monthFilter));
          const matchesYear = yearFilter === "all" || 
            date.getFullYear() === Number.parseInt(yearFilter);
          
          return matchesMonth && matchesYear;
        });
      };
      
      // Active status
      const matchesActive = showInactive || patient.is_active;

      return (
        matchesSearch && 
        matchesGender && 
        matchesSite && 
        matchesBuilding && 
        matchesActive && 
        patientHasActivitiesInPeriod()
      );
    });

    // Sort patients
    return [...filtered].sort((a, b) => {
      if (!sortField) return 0;

      // Special handling for 'name' field
      if (sortField === 'name') {
        const aName = getFullName(a);
        const bName = getFullName(b);
        
        if (aName < bName) return sortDirection === "asc" ? -1 : 1;
        if (aName > bName) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }
      
      const actualSortField = getSortField(sortField);
      if (!actualSortField) return 0;
      
      const aValue = a[actualSortField];
      const bValue = b[actualSortField];

      if (aValue && bValue) {
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [patients, searchTerm, genderFilter, siteFilter, buildingFilter, monthFilter, yearFilter, showInactive, sortField, sortDirection, patientActivities]);

  // Handle sort
  const handleSort = (field: keyof Patient | "name") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getGenderDisplay = (gender: string) => {
    return gender === "M" ? "M" : gender === "F" ? "F" : "O";
  };

  // Handle patient creation callback
  const handlePatientAdded = () => {
    fetchPatientsData();
  };

  // Handle opening the add activity modal
  const handleAddActivity = (patient: Patient) => {
    setSelectedPatientId(patient.id?.toString() || "");
    setSelectedPatientName(`${patient.last_name}, ${patient.first_name}`);
    setSelectedPatientSite(patient.site_name || "");
    setIsAddActivityModalOpen(true);
  };

  // Helper to format dates consistently
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-6 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Header with title and Add Patient button */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">All Patients</h1>
          {!isPharmacist && !isNurse && (
            <button
              onClick={() => setIsAddPatientModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Patient
            </button>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex-shrink-0">
          <div className="flex flex-col space-y-3">
            {/* Top row with show inactive toggle and search */}
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
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={() => setShowInactive(!showInactive)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">Show Inactive Patients</span>
              </label>
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
                    <option value="all">All Sites</option>
                    {siteNames.map((site) => (
                      <option key={site} value={site}>
                        {site}
                      </option>
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
                    <option value="all">
                      {siteFilter === "all" 
                        ? "All Buildings" 
                        : availableBuildings.length === 0 
                          ? `No buildings for ${siteFilter}` 
                          : "All Buildings"}
                    </option>
                    {availableBuildings.map((building) => (
                      <option key={building} value={building}>
                        {building}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Activity Month</label>
                <div className="relative">
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="all">All Months</option>
                    {months.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Activity Year</label>
                <div className="relative">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
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
              onClick={fetchPatientsData} 
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
              <div className="text-gray-500">Loading patients data...</div>
            </div>
          </div>
        )}

        {/* Table - only show when not loading and no error */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col max-h-[60vh] min-h-0">
            {/* Scrollable Table with Fixed Header */}
            <div className="flex-1 overflow-auto min-h-0 table-container">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        <span>Name</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === "name" && sortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === "name" && sortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("birthdate")}
                    >
                      <div className="flex items-center">
                        <span>Birthdate</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === "birthdate" && sortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === "birthdate" && sortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("gender")}
                    >
                      <div className="flex items-center">
                        <span>Gender</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === "gender" && sortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === "gender" && sortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("site_name")}
                    >
                      <div className="flex items-center">
                        <span>Site</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === "site_name" && sortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === "site_name" && sortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("building")}
                    >
                      <div className="flex items-center">
                        <span>Building</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon
                            className={`h-3 w-3 ${
                              sortField === "building" && sortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                            }`}
                          />
                          <ArrowDownIcon
                            className={`h-3 w-3 ${
                              sortField === "building" && sortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedPatients.length > 0 
                    ? filteredAndSortedPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => navigate(`/patientdetails/${patient.id}`)}
                            className="inline-flex items-center px-2 py-1 rounded text-blue-600 hover:text-blue-900 hover:underline transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                          >
                            {getFullName(patient)}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.birthdate ? new Date(patient.birthdate).toLocaleDateString() : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getGenderDisplay(patient.gender)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.is_active ? (
                            <button
                              onClick={() => handleAddActivity(patient)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-blue-500 text-xs font-medium rounded text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                            >
                              <PlusIcon className="h-3 w-3 mr-1" />
                              Add Activity
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Patient Inactive</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.site_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.building || '-'}</td>
                      </tr>
                    ))
                    : <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No patients found matching your filters
                      </td>
                    </tr>
                  }
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
                    Showing <span className="font-medium">{filteredAndSortedPatients.length}</span> of{" "}
                    <span className="font-medium">{filteredAndSortedPatients.length}</span> results
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Scroll to view more patients
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        onPatientAdded={handlePatientAdded}
      />

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={() => setIsAddActivityModalOpen(false)}
        onActivityAdded={() => fetchPatientsData()}
        patientId={selectedPatientId}
        patientName={selectedPatientName}
        siteName={selectedPatientSite}
      />
    </div>
  )
}
