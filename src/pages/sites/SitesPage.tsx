import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSites } from '../../services/siteService';
import type { Site } from '../../services/siteService';
import AddSiteModal from '../../components/AddSiteModal';
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, SearchIcon, Plus, Building2 } from 'lucide-react';

const SitesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchSites = async () => {
    try {
      const data = await getSites();
      setSites(data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleSiteClick = (siteId: number) => {
    navigate(`/sites/${siteId}`);
  };

  // Get unique states for filter
  const states = Array.from(new Set(sites.map(site => site.state))).sort();

  // Filtering and sorting
  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.zip.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesState = stateFilter === 'all' || site.state === stateFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && site.is_active) ||
      (statusFilter === 'inactive' && !site.is_active);

    return matchesSearch && matchesState && matchesStatus;
  });

  const sortedSites = [...filteredSites].sort((a, b) => {
    let aValue: any = a[sortField as keyof typeof a];
    let bValue: any = b[sortField as keyof typeof b];

    // Handle boolean values
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sites</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </button>
        </div>

        <AddSiteModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSiteAdded={fetchSites}
        />

        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
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
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <div className="relative">
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="all">All States</option>
                    {states.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                  </div>
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="h-3 w-3 text-gray-500" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      <span>Name</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('address')}>
                    <div className="flex items-center">
                      <span>Address</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'address' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'address' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('city')}>
                    <div className="flex items-center">
                      <span>City</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'city' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'city' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('state')}>
                    <div className="flex items-center">
                      <span>State</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'state' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'state' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('zip')}>
                    <div className="flex items-center">
                      <span>ZIP</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'zip' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'zip' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('is_active')}>
                    <div className="flex items-center">
                      <span>Status</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon className={`h-3 w-3 ${sortField === 'is_active' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        <ArrowDownIcon className={`h-3 w-3 ${sortField === 'is_active' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSites.length > 0 ? (
                  sortedSites.map((site) => (
                    <tr
                      key={site.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleSiteClick(site.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline">
                        {site.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.city}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.state}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.zip}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          site.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {site.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No sites found
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

export default SitesPage; 