import React, { useState, useEffect } from 'react';
import { Building as BuildingIcon, ChevronDownIcon, ChevronRight, Plus, SearchIcon, Pencil, Trash } from 'lucide-react';
import type { Building } from '../../services/buildingService';
import { getBuildingsBySiteId, deleteBuilding } from '../../services/buildingService';
import { AddBuildingModal } from '../../components/AddBuildingModal';
import { EditBuildingModal } from '../../components/EditBuildingModal';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

interface BuildingsBySiteProps {
    siteId: string;
    expanded: boolean;
    onToggle: () => void;
}

export const BuildingsBySite: React.FC<BuildingsBySiteProps> = ({ siteId, expanded, onToggle }) => {
    const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [buildingSearchTerm, setBuildingSearchTerm] = useState('');
    const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
    const [isEditBuildingModalOpen, setIsEditBuildingModalOpen] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Add useEffect to fetch buildings when component mounts and when expanded changes
    useEffect(() => {
        if (expanded && siteId && !isNaN(parseInt(siteId))) {
            handleAddBuilding();
        }
    }, [expanded, siteId]);

    const handleAddBuilding = async () => {
        if (!siteId || isNaN(parseInt(siteId))) return;
        setIsLoadingBuildings(true);
        try {
            const data = await getBuildingsBySiteId(parseInt(siteId));
            setBuildings(data);
        } catch (err) {
            console.error("Error fetching buildings:", err);
        } finally {
            setIsLoadingBuildings(false);
        }
    };

    const handleEditBuilding = (building: Building) => {
        setSelectedBuilding(building);
        setIsEditBuildingModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditBuildingModalOpen(false);
        setSelectedBuilding(null);
    };

    const handleBuildingUpdated = () => {
        handleAddBuilding(); // Refresh the buildings list
    };

    const confirmDeleteBuilding = async () => {
        if (!buildingToDelete) return;
        
        setIsDeleting(true);
        try {
            await deleteBuilding(buildingToDelete.id);
            await handleAddBuilding(); // Refresh the list
            setIsDeleteModalOpen(false);
            setBuildingToDelete(null);
        } catch (err) {
            console.error("Error deleting building:", err);
            alert("Failed to delete building. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter buildings based on search term
    const filteredBuildings = buildings.filter(building =>
        building.name.toLowerCase().includes(buildingSearchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <div className={`p-6 ${expanded ? 'border-b border-gray-200' : ''}`}>
                <div 
                    className="flex flex-col gap-4"
                >
                    <div className="flex items-center gap-2 cursor-pointer" onClick={onToggle}>
                        <BuildingIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <h2 className="text-lg font-semibold text-gray-900">Buildings</h2>
                        {expanded ? (
                            <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                    </div>

                    {expanded && (
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search buildings..."
                                    value={buildingSearchTerm}
                                    onChange={(e) => setBuildingSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <button
                                onClick={() => setIsAddBuildingModalOpen(true)}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer w-full sm:w-auto"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Building
                            </button>
                        </div>
                    )}
                </div>
            </div>
                
            {expanded && (
                <div className="flex flex-col max-h-[60vh] min-h-0">
                    <div className="flex-1 overflow-auto min-h-0 table-container">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Building Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created At
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingBuildings ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                <span className="ml-2">Loading buildings...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredBuildings.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                            {buildingSearchTerm ? 'No buildings found matching your search' : 'No buildings found'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBuildings.map((building) => (
                                        <tr key={building.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {building.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(building.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleEditBuilding(building)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                                                        title="Edit building"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setBuildingToDelete(building);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                                                        title="Delete building"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex-shrink-0 bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <span className="text-sm text-gray-700">Buildings</span>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{filteredBuildings.length}</span> of{" "}
                                    <span className="font-medium">{filteredBuildings.length}</span> buildings
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Scroll to view more buildings
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Building Modal */}
            <AddBuildingModal
                isOpen={isAddBuildingModalOpen}
                onClose={() => setIsAddBuildingModalOpen(false)}
                siteId={parseInt(siteId || '0')}
                onBuildingAdded={handleAddBuilding}
            />

            {/* Edit Building Modal */}
            <EditBuildingModal
                isOpen={isEditBuildingModalOpen}
                onClose={handleCloseEditModal}
                building={selectedBuilding}
                onBuildingUpdated={handleBuildingUpdated}
            />

            {/* Delete Building Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setBuildingToDelete(null);
                }}
                onConfirm={confirmDeleteBuilding}
                isDeleting={isDeleting}
                itemName={buildingToDelete ? `building ${buildingToDelete.name}` : 'building'}
            />
        </div>
    );
}; 