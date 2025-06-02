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
  const [showInactive, setShowInactive] = useState(false);

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

  // Helper function to capitalize site names
  const capitalizeSiteName = (name: string) => {
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Filtering and sorting
  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.zip.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = showInactive || site.is_active;

    return matchesSearch && matchesStatus;
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
      <div className="h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <div className="flex-1 flex flex-col px-4 py-6 max-w-7xl mx-auto w-full overflow-hidden">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
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

          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex-shrink-0">
            <div className="flex flex-col space-y-3">
              {/* Top row with search and show inactive toggle */}
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
                  <span className="ml-3 text-sm font-medium text-gray-700">Show Inactive Sites</span>
                </label>
              </div>
            </div>
          </div>

          {/* Loading state for table */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 flex justify-center items-center max-h-[60vh]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <div className="text-gray-500">Loading sites data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-6 max-w-7xl mx-auto w-full overflow-hidden">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
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

        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex-shrink-0">
          <div className="flex flex-col space-y-3">
            {/* Top row with search and show inactive toggle */}
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
                <span className="ml-3 text-sm font-medium text-gray-700">Show Inactive Sites</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 flex flex-col max-h-[60vh] min-h-0">
          {/* Scrollable Table with Fixed Header */}
          <div className="flex-1 overflow-auto min-h-0 table-container">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
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
                        {capitalizeSiteName(site.name)}
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
                  Showing <span className="font-medium">{sortedSites.length}</span> of{" "}
                  <span className="font-medium">{sortedSites.length}</span> results
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Scroll to view more sites
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitesPage; 