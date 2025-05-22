import { useState, useEffect } from "react"
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon, SearchIcon, PlusIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import AddPatientModal from "../../components/AddPatientModal"
import AddActivityModal from "../../components/AddActivityModal"
import { getPatients } from "../../services/patientService"
import type { Patient } from "../../services/patientService"

export default function PatientsPage() {
  const navigate = useNavigate()
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false)
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [selectedPatientName, setSelectedPatientName] = useState<string>("")
  const [selectedPatientSite, setSelectedPatientSite] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for patients data
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [activityFilter, setActivityFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<keyof Patient | "name" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [siteFilter, setSiteFilter] = useState<string>("all")
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)
  const [buildingFilter, setBuildingFilter] = useState<string>("all")

  // Fetch patients data
  const fetchPatientsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchPatientsData();
  }, []);

  // Sample data for filters
  const sites = ["CP Intermountain"]
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const years = [2020, 2021, 2022, 2023, 2024, 2025]
  const buildings = [
    "Building A",
    "Building B",
    "Building C",
    "Building D",
    "Main Building",
    "North Wing",
    "South Wing",
    "East Wing",
    "West Wing",
    "Administrative Building",
    "Medical Center",
    "Outpatient Center",
    "Emergency Department",
    "Surgery Center"
  ]

  // Helper to get full name from first and last name
  const getFullName = (patient: Patient) => {
    return `${patient.first_name} ${patient.last_name}`;
  };

  // Map sortField 'name' to actual field
  const getSortField = (field: typeof sortField): keyof Patient | null => {
    if (field === 'name') return 'first_name';
    return field;
  };

  // Filter and sort data
  const filteredPatients = patients.filter((patient) => {
    const fullName = getFullName(patient);
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(patient.id).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGender = genderFilter === "all" || patient.gender === genderFilter;
    
    // Site filter
    const matchesSite = siteFilter === "all" || patient.site_name === siteFilter;
    
    // Building filter
    const matchesBuilding = buildingFilter === "all" || patient.building === buildingFilter;
    
    // Month and year filters from birthdate
    const birthdate = patient.birthdate ? new Date(patient.birthdate) : null;
    const matchesMonth =
      monthFilter === "all" ||
      (birthdate && birthdate.getMonth() + 1 === Number.parseInt(monthFilter));
    
    const matchesYear =
      yearFilter === "all" || 
      (birthdate && birthdate.getFullYear() === Number.parseInt(yearFilter));
    
    // Active status
    const matchesActive = showInactive || patient.is_active;

    return (
      matchesSearch && matchesGender && matchesSite && matchesMonth && matchesYear && matchesActive && matchesBuilding
    );
  });

  // Sort patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
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
    setSelectedPatientId(patient.id.toString());
    setSelectedPatientName(`${patient.last_name}, ${patient.first_name}`);
    setSelectedPatientSite(patient.site_name);
    setIsAddActivityModalOpen(true);
  };

  // Dropdown component
  const Dropdown = ({
    label,
    options,
    value,
    onChange,
  }: {
    label: string
    options: string[]
    value: string
    onChange: (value: string) => void
  }) => {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border shadow-sm appearance-none"
          >
            <option value="all">All {label}s</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">All Patients</h1>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col space-y-4">
            {/* Top row with total patients and search */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center space-x-6">
                <div className="text-lg font-semibold text-gray-800">
                  Total Active Patients: <span className="text-blue-600">{patients.filter(p => p.is_active).length}</span>
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddPatientModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Add Patient
                </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <div className="relative">
                  <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border appearance-none"
                  >
                    <option value="all">All Sites</option>
                    <option value="CP Greater San Antonio">CP Greater San Antonio</option>
                    {sites.map((site) => (
                      <option key={site} value={site}>
                        {site}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                <div className="relative">
                  <select
                    value={buildingFilter}
                    onChange={(e) => setBuildingFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border appearance-none"
                  >
                    <option value="all">All Buildings</option>
                    {buildings.map((building) => (
                      <option key={building} value={building}>
                        {building}
                      </option>
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
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border appearance-none"
                  >
                    <option value="all">All Months</option>
                    {months.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
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
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border appearance-none"
                  >
                    <option value="all">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
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

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
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
          <div className="bg-white rounded-lg border border-gray-200 p-8 flex justify-center items-center">
            <div className="text-gray-500">Loading patients data...</div>
          </div>
        )}

        {/* Table - only show when not loading and no error */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                  {sortedPatients.length > 0 ? (
                    sortedPatients.map((patient) => (
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
                          <button
                            onClick={() => handleAddActivity(patient)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-blue-500 text-xs font-medium rounded text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Add Activity
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.site_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.building || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No patients found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
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
                    Showing <span className="font-medium">1</span> to{" "}
                    <span className="font-medium">{sortedPatients.length}</span> of{" "}
                    <span className="font-medium">{sortedPatients.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      1
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
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
