import React, { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, Trash2, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import SiteModal from '../../components/SiteModal';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { getAllSites, createSite, updateSite, deleteSite } from '../../services/siteService';
import type { Site, CreateSiteDto, UpdateSiteDto } from '../../services/siteService';

const SitesPage = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sortField, setSortField] = useState<keyof Site>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setIsLoading(true);
      const data = await getAllSites();
      setSites(data);
    } catch (err) {
      setError('Failed to fetch sites');
      console.error('Error fetching sites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: keyof Site) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (site: Site) => {
    setSelectedSite(site);
    setIsEditModalOpen(true);
  };

  const handleDelete = (site: Site) => {
    setSiteToDelete(site);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!siteToDelete?.id) return;
    
    try {
      setIsDeleting(true);
      await deleteSite(siteToDelete.id);
      await fetchSites();
      setIsDeleteModalOpen(false);
      setSiteToDelete(null);
    } catch (err) {
      console.error('Error deleting site:', err);
      setError('Failed to delete site');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateSite = async (siteData: CreateSiteDto) => {
    try {
      await createSite(siteData);
      await fetchSites();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error creating site:', err);
      setError('Failed to create site');
    }
  };

  const handleUpdateSite = async (id: number, siteData: UpdateSiteDto) => {
    try {
      await updateSite(id, siteData);
      await fetchSites();
      setIsEditModalOpen(false);
      setSelectedSite(null);
    } catch (err) {
      console.error('Error updating site:', err);
      setError('Failed to update site');
    }
  };

  // Filter and sort sites
  const filteredAndSortedSites = sites
    .filter(site => {
      const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.state.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = showInactive ? !site.is_active : site.is_active;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const sortOrder = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * sortOrder;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Site
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search sites..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="w-full sm:w-48 flex-shrink-0">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Show Inactive Sites</span>
              </label>
            </div>
          </div>
        </div>

        {/* Sites Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      <span>Name</span>
                      <div className="ml-1 flex">
                        <ArrowUpIcon
                          className={`h-3 w-3 ${
                            sortField === 'name' && sortDirection === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          }`}
                        />
                        <ArrowDownIcon
                          className={`h-3 w-3 ${
                            sortField === 'name' && sortDirection === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ZIP
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading sites...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredAndSortedSites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No sites found
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedSites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {site.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {site.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {site.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {site.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {site.zip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            site.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {site.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEdit(site)}
                            className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                            title="Edit site"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(site)}
                            className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                            title="Delete site"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mode="add"
        onSubmit={(data) => handleCreateSite(data as CreateSiteDto)}
      />
      <SiteModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        site={selectedSite}
        mode="edit"
        onSubmit={(data) => selectedSite?.id && handleUpdateSite(selectedSite.id, data as UpdateSiteDto)}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSiteToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        itemName={siteToDelete ? `site ${siteToDelete.name}` : 'site'}
      />
    </div>
  );
};

export default SitesPage; 