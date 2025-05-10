import { useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon, SearchIcon, PlusIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import AddPatientModal from "../../components/AddPatientModal"

interface Person {
  id: string
  name: string
  birthdate: string
  gender: "Male" | "Female" | "Other"
  createActivity: string
  totalTime: number
}

export default function PatientsPage() {
  const navigate = useNavigate()
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false)

  // Sample data
  const initialData: Person[] = [
    {
      id: "P001",
      name: "Sarah Chen",
      birthdate: "1990-05-15",
      gender: "Female",
      createActivity: "Running",
      totalTime: 450,
    },
    {
      id: "P002",
      name: "John Smith",
      birthdate: "1985-11-20",
      gender: "Male",
      createActivity: "Swimming",
      totalTime: 320,
    },
    {
      id: "P003",
      name: "Emily Johnson",
      birthdate: "1992-03-25",
      gender: "Female",
      createActivity: "Cycling",
      totalTime: 520,
    },
    {
      id: "P004",
      name: "Michael Brown",
      birthdate: "1988-07-18",
      gender: "Male",
      createActivity: "Yoga",
      totalTime: 400,
    },
    {
      id: "P005",
      name: "Jessica Lee",
      birthdate: "1995-09-22",
      gender: "Female",
      createActivity: "Running",
      totalTime: 600,
    },
    {
      id: "P006",
      name: "David Wilson",
      birthdate: "1983-12-30",
      gender: "Male",
      createActivity: "Swimming",
      totalTime: 480,
    },
    {
      id: "P007",
      name: "Amanda Robinson",
      birthdate: "1991-04-15",
      gender: "Female",
      createActivity: "Cycling",
      totalTime: 350,
    },
    {
      id: "P008",
      name: "Robert Taylor",
      birthdate: "1987-08-05",
      gender: "Male",
      createActivity: "Yoga",
      totalTime: 290,
    },
    {
      id: "P009",
      name: "Jennifer Garcia",
      birthdate: "1993-10-10",
      gender: "Female",
      createActivity: "Running",
      totalTime: 510,
    },
    {
      id: "P010",
      name: "Thomas Martinez",
      birthdate: "1986-02-17",
      gender: "Male",
      createActivity: "Swimming",
      totalTime: 380,
    },
    {
      id: "P011",
      name: "Lisa Anderson",
      birthdate: "1989-06-15",
      gender: "Female",
      createActivity: "Cycling",
      totalTime: 420,
    },
    {
      id: "P012",
      name: "James Wilson",
      birthdate: "1984-09-29",
      gender: "Male",
      createActivity: "Yoga",
      totalTime: 330,
    },
  ]

  // State
  const [data, setData] = useState<Person[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [activityFilter, setActivityFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<keyof Person | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [siteFilter, setSiteFilter] = useState<string>("CP Greater San Antonio")
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)

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

  // Get unique departments for filter
  const activities = Array.from(new Set(initialData.map((item) => item.createActivity)))
  const genders = Array.from(new Set(initialData.map((item) => item.gender)))

  // Filter and sort data
  const filteredData = initialData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGender = genderFilter === "all" || item.gender === genderFilter
    const matchesActivity = activityFilter === "all" || item.createActivity === activityFilter

    // New filters
    const matchesSite = siteFilter === "all" || true // Replace with actual site matching when you have site data
    const matchesMonth =
      monthFilter === "all" ||
      (item.birthdate && new Date(item.birthdate).getMonth() + 1 === Number.parseInt(monthFilter))
    const matchesYear =
      yearFilter === "all" || (item.birthdate && new Date(item.birthdate).getFullYear() === Number.parseInt(yearFilter))
    const matchesActive = showInactive || true // Replace with actual active status matching when you have that data

    return (
      matchesSearch && matchesGender && matchesActivity && matchesSite && matchesMonth && matchesYear && matchesActive
    )
  })

  // Sort data if sort field is set
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  // Handle sort
  const handleSort = (field: keyof Person) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getGenderDisplay = (gender: string) => {
    return gender === "Male" ? "M" : gender === "Female" ? "F" : "O"
  }

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
              <div className="flex items-center">
                <div className="text-lg font-semibold text-gray-800">
                  Total Active Patients: <span className="text-blue-600">176</span>
                </div>
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

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center h-[38px]">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={() => setShowInactive(!showInactive)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Show Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
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
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("createActivity")}
                  >
                    <div className="flex items-center">
                      <span>Create Activity</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon
                          className={`h-3 w-3 ${
                            sortField === "createActivity" && sortDirection === "asc"
                              ? "text-blue-600"
                              : "text-gray-300"
                          }`}
                        />
                        <ArrowDownIcon
                          className={`h-3 w-3 ${
                            sortField === "createActivity" && sortDirection === "desc"
                              ? "text-blue-600"
                              : "text-gray-300"
                          }`}
                        />
                      </div>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalTime")}
                  >
                    <div className="flex items-center">
                      <span>Total Time</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon
                          className={`h-3 w-3 ${
                            sortField === "totalTime" && sortDirection === "asc" ? "text-blue-600" : "text-gray-300"
                          }`}
                        />
                        <ArrowDownIcon
                          className={`h-3 w-3 ${
                            sortField === "totalTime" && sortDirection === "desc" ? "text-blue-600" : "text-gray-300"
                          }`}
                        />
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.length > 0 ? (
                  sortedData.map((person) => (
                    <tr
                      key={person.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/patientdetails`)}
                          className="inline-flex items-center px-2 py-1 rounded text-blue-600 hover:text-blue-900 hover:underline transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {person.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(person.birthdate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getGenderDisplay(person.gender)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => navigate(`/activity?patientId=${person.id}`)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-blue-500 text-xs font-medium rounded text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          Add Activity
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.totalTime} min</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No data found matching your filters
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
                  <span className="font-medium">{sortedData.length}</span> of{" "}
                  <span className="font-medium">{sortedData.length}</span> results
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
      </div>

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
      />
    </div>
  )
}
