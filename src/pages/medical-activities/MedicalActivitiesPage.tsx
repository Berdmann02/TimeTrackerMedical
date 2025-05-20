import React, { useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, SearchIcon, Plus } from 'lucide-react';

// Mock data for demonstration
const mockActivities = [
  { id: 163134, name: 'Smith, John', initials: 'JS', pharm: true, recordDate: '05/14/2025', totalTime: 6.02 },
  { id: 163133, name: 'Doe, Jane', initials: 'JD', pharm: false, recordDate: '05/14/2025', totalTime: 6.02 },
  { id: 163132, name: 'Johnson, Emily', initials: 'EJ', pharm: true, recordDate: '05/14/2025', totalTime: 6.02 },
  { id: 163131, name: 'Williams, Michael', initials: 'MW', pharm: false, recordDate: '05/14/2025', totalTime: 6.02 },
  { id: 163130, name: 'Brown, Olivia', initials: 'OB', pharm: true, recordDate: '05/14/2025', totalTime: 6.02 },
  { id: 163129, name: 'Jones, Ethan', initials: 'EJ', pharm: false, recordDate: '05/14/2025', totalTime: 6.00 },
  { id: 163128, name: 'Garcia, Ava', initials: 'AG', pharm: true, recordDate: '05/14/2025', totalTime: 6.02 },
  { id: 163127, name: 'Martinez, Mason', initials: 'MM', pharm: false, recordDate: '05/14/2025', totalTime: 6.02 },
  { id: 163126, name: 'Davis, Sophia', initials: 'SD', pharm: true, recordDate: '05/14/2025', totalTime: 6.00 },
];

const sites = ['CP Greater San Antonio', 'CP Intermountain'];
const months = [1,2,3,4,5,6,7,8,9,10,11,12];
const years = [2023, 2024, 2025];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MedicalActivitiesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState(sites[0]);
  const [monthFilter, setMonthFilter] = useState(5);
  const [yearFilter, setYearFilter] = useState(2025);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filtering and sorting
  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch =
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(activity.id).includes(searchTerm);
    // In a real app, filter by site/month/year as well
    return matchesSearch;
  });

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    let aValue = a[sortField as keyof typeof a];
    let bValue = b[sortField as keyof typeof b];
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
        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col space-y-4">
            {/* Top row with search */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center">
                <div className="text-lg font-semibold text-gray-800">
                  Total Activities: <span className="text-blue-600">{mockActivities.length}</span>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      <span>Name</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('initials')}>
                    <div className="flex items-center">
                      <span>Initials</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'initials' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'initials' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-900 hover:underline">{activity.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-900 hover:underline">{activity.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.initials}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.pharm ? 'Yes' : 'No'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.recordDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.totalTime.toFixed(2)}</td>
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
        </div>
      </div>
    </div>
  );
};

export default MedicalActivitiesPage; 