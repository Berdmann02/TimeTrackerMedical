import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSites } from '../../services/siteService';
import type { Site } from '../../services/siteService';
import AddSiteModal from '../../components/AddSiteModal';

const SitesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  return (
    <div className="container mx-auto py-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add New Site
            </button>
          </div>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ZIP</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sites.map((site) => (
                    <tr
                      key={site.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSiteClick(site.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.city}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.state}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.zip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddSiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSiteAdded={fetchSites}
      />
    </div>
  );
};

export default SitesPage; 