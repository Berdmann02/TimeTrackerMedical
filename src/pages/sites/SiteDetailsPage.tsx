import React, { useState, useEffect } from 'react';
import { Building2, ChevronLeft, Pencil, Save, X, ArrowUpIcon, ArrowDownIcon, ChevronDownIcon, Users, UserSquare2, Building as BuildingIcon, ChevronRight, Plus, SearchIcon, Trash } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSiteById, updateSite } from '../../services/siteService';
import type { Site } from '../../services/siteService';
import { AddBuildingModal } from '../../components/AddBuildingModal';
import { EditBuildingModal } from '../../components/EditBuildingModal';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { getBuildingsBySiteId, deleteBuilding, type Building } from '../../services/buildingService';
import { getUsersBySite, type User } from '../../services/userService';
import AddUserModal from '../../components/AddUserModal';
import EditUserModal from '../../components/EditUserModal';
import { useAuth } from '../../contexts/AuthContext';

// DetailRow component for editable fields that maintains original UI
interface DetailRowProps {
    icon?: any;
    label: string;
    value: string | boolean | number | null | undefined;
    isEditing?: boolean;
    onEdit?: (value: any) => void;
    editType?: 'text' | 'date' | 'select' | 'checkbox' | 'readonly';
    editOptions?: string[];
    className?: string;
}

const DetailRow: React.FC<DetailRowProps> = React.memo(({
    icon: Icon,
    label,
    value,
    isEditing = false,
    onEdit,
    editType = 'text',
    editOptions = [],
    className = ''
}) => {
    const renderValue = () => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return value;
    };

    const renderEditField = () => {
        if (!isEditing || editType === 'readonly') {
            return (
                <p className={`text-gray-900 ${className}`}>
                    {renderValue()}
                </p>
            );
        }

        switch (editType) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={value as string || ''}
                        onChange={(e) => onEdit && onEdit(e.target.value)}
                        className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                );
            case 'select':
                return (
                    <select
                        value={value as string || ''}
                        onChange={(e) => onEdit && onEdit(e.target.value)}
                        className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        {editOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                );
            case 'checkbox':
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{label}</span>
                        <input
                            type="checkbox"
                            checked={value as boolean}
                            onChange={(e) => onEdit && onEdit(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </div>
                );
            default:
                return <p className={`text-gray-900 ${className}`}>{renderValue()}</p>;
        }
    };

    if (editType === 'checkbox' && isEditing) {
        return renderEditField();
    }

    return (
        <div>
            <label className="text-sm font-medium text-gray-500 block">{label}</label>
            <div className="mt-1">
                {renderEditField()}
            </div>
        </div>
    );
});

// Add type for transformed user
interface TransformedUser {
    id?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: "admin" | "nurse" | "pharmacist";
    primarySite?: string;
    assignedSites?: string[];
}

export default function SiteDetailsPage() {
    const navigate = useNavigate();
    const { siteId } = useParams<{ siteId: string }>();
    const { user: currentUser } = useAuth();
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [site, setSite] = useState<Site | null>(null);
    const [editedSite, setEditedSite] = useState<Site | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
    const [isEditBuildingModalOpen, setIsEditBuildingModalOpen] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
    const [buildingSearchTerm, setBuildingSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<TransformedUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);

    // Add state for expandable sections
    const [expandedSections, setExpandedSections] = useState({
        buildings: true,
        users: true,
        patients: true
    });

    // Helper function to check if user is the current user - moved up here
    const isCurrentUser = (user: User) => {
        return currentUser && user.email === currentUser.email;
    };

    // Function to get full role name
    const getFullRoleName = (role: string): string => {
        switch (role.toLowerCase()) {
            case 'a':
                return 'Admin';
            case 'p':
                return 'Pharmacist';
            case 'n':
                return 'Nurse';
            default:
                return role;
        }
    };

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    ).sort((a, b) => {
        // Current user always comes first
        const aIsCurrentUser = isCurrentUser(a);
        const bIsCurrentUser = isCurrentUser(b);
        
        if (aIsCurrentUser && !bIsCurrentUser) return -1;
        if (!aIsCurrentUser && bIsCurrentUser) return 1;
        
        // If neither is current user, maintain alphabetical order
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    });

    useEffect(() => {
        const fetchSiteData = async () => {
            if (!siteId) {
                setError("No site ID provided");
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            setError(null);
            
            try {
                const siteData = await getSiteById(parseInt(siteId, 10));
                setSite(siteData);
            } catch (err) {
                console.error("Error fetching site data:", err);
                setError("Failed to load site data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchSiteData();
    }, [siteId]);

    useEffect(() => {
        if (siteId && expandedSections.buildings) {
            handleAddBuilding();
        }
    }, [siteId, expandedSections.buildings]);

    // Add useEffect for fetching users
    useEffect(() => {
        const fetchUsers = async () => {
            if (!site?.name || !expandedSections.users) return;
            
            setIsLoadingUsers(true);
            try {
                const siteUsers = await getUsersBySite(site.name);
                setUsers(siteUsers);
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [site?.name, expandedSections.users]);

    const handleEditSite = () => {
        setIsEditing(true);
        setEditedSite(site);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedSite(site);
    };

    const handleSave = async () => {
        if (!siteId || !editedSite) return;
        
        setIsSaving(true);
        
        try {
            const updatedSite = await updateSite(parseInt(siteId, 10), editedSite);
            setSite(updatedSite);
            setEditedSite(updatedSite);
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating site:", err);
            alert("Failed to update site. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        if (!editedSite) return;
        
        setEditedSite(prev => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleAddBuilding = async () => {
        if (!siteId) return;
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

    const handleDeleteBuilding = async (buildingId: number) => {
        if (!confirm('Are you sure you want to delete this building?')) return;
        
        try {
            await deleteBuilding(buildingId);
            await handleAddBuilding(); // Refresh the list
        } catch (err) {
            console.error("Error deleting building:", err);
            alert("Failed to delete building. Please try again.");
        }
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

    // User handlers
    const handleEditUser = (user: User) => {
        const transformedUser = {
            id: user.id?.toString(),
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role as "admin" | "nurse" | "pharmacist",
            primarySite: user.primarysite,
            assignedSites: user.assignedsites
        };
        setSelectedUser(transformedUser);
        setIsEditUserModalOpen(true);
    };

    const handleCloseEditUserModal = () => {
        setIsEditUserModalOpen(false);
        setSelectedUser(null);
    };

    const handleUserUpdated = () => {
        // Refresh the users list
        if (site?.name) {
            getUsersBySite(site.name).then(setUsers);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        
        setIsDeletingUser(true);
        try {
            // Add your delete user API call here
            // await deleteUser(userToDelete.id);
            await handleUserUpdated(); // Refresh the list
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Failed to delete user. Please try again.");
        } finally {
            setIsDeletingUser(false);
        }
    };

    // Filter buildings based on search term
    const filteredBuildings = buildings.filter(building =>
        building.name.toLowerCase().includes(buildingSearchTerm.toLowerCase())
    );

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100">
                <div className="px-4 py-6 max-w-7xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/sites')}
                                className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                title="Back to All Sites"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900">Site Details</h1>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 p-8 flex justify-center items-center max-h-[60vh]">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <div className="text-gray-500">Loading site data...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !site) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100">
                <div className="px-4 py-6 max-w-7xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/sites')}
                                className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                title="Back to All Sites"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900">Site Details</h1>
                        </div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 max-h-[60vh] flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-red-600 mb-4 text-5xl">!</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Site</h2>
                            <p className="text-gray-600 mb-4">{error || "Site data not found"}</p>
                            <button 
                                onClick={() => navigate('/sites')}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Return to Sites List
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="px-4 py-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/sites')}
                            className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                            title="Back to All Sites"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Site Details</h1>
                    </div>
                    <div className="flex space-x-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleEditSite}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Site
                            </button>
                        )}
                    </div>
                </div>

                {/* Site Information Card */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Basic Information
                                </h2>
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Inactive</span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={editedSite?.is_active}
                                            onClick={() => handleFieldChange('is_active', !editedSite?.is_active)}
                                            className={`${
                                                editedSite?.is_active ? 'bg-blue-600' : 'bg-gray-200'
                                            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`${
                                                    editedSite?.is_active ? 'translate-x-5' : 'translate-x-0'
                                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                            />
                                        </button>
                                        <span className="text-sm text-gray-600">Active</span>
                                    </div>
                                ) : (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        site.is_active
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}>
                                        {site.is_active ? "Active" : "Inactive"}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <DetailRow
                                    label="Name"
                                    value={isEditing ? editedSite?.name : site.name}
                                    isEditing={isEditing}
                                    editType="text"
                                    onEdit={(value) => handleFieldChange('name', value)}
                                />
                                <DetailRow
                                    label="Address"
                                    value={isEditing ? editedSite?.address : site.address}
                                    isEditing={isEditing}
                                    editType="text"
                                    onEdit={(value) => handleFieldChange('address', value)}
                                />
                                <DetailRow
                                    label="City"
                                    value={isEditing ? editedSite?.city : site.city}
                                    isEditing={isEditing}
                                    editType="text"
                                    onEdit={(value) => handleFieldChange('city', value)}
                                />
                                <DetailRow
                                    label="State"
                                    value={isEditing ? editedSite?.state : site.state}
                                    isEditing={isEditing}
                                    editType="text"
                                    onEdit={(value) => handleFieldChange('state', value)}
                                />
                                <DetailRow
                                    label="ZIP"
                                    value={isEditing ? editedSite?.zip : site.zip}
                                    isEditing={isEditing}
                                    editType="text"
                                    onEdit={(value) => handleFieldChange('zip', value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buildings Section */}
                <div className="space-y-6">
                    {/* Buildings Table */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className={`p-4 ${expandedSections.buildings ? 'border-b border-gray-200' : ''}`}>
                            <div 
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => toggleSection('buildings')}
                            >
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <BuildingIcon className="w-5 h-5 text-blue-600" />
                                    Buildings
                                    {expandedSections.buildings ? (
                                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )}
                                </h2>
                                {expandedSections.buildings && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsAddBuildingModalOpen(true);
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Building
                                    </button>
                                )}
                            </div>
                            
                            {expandedSections.buildings && (
                                <div className="relative w-full md:w-64 mt-4">
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
                            )}
                        </div>
                        
                        {expandedSections.buildings && (
                            <div className="overflow-auto max-h-96 table-container">
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
                        )}
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className={`p-4 ${expandedSections.users ? 'border-b border-gray-200' : ''}`}>
                            <div 
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => toggleSection('users')}
                            >
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Users
                                    {expandedSections.users ? (
                                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )}
                                </h2>
                                {expandedSections.users && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsAddUserModalOpen(true);
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add User
                                    </button>
                                )}
                            </div>
                            
                            {expandedSections.users && (
                                <div className="relative w-full md:w-64 mt-4">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SearchIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            )}
                        </div>
                        
                        {expandedSections.users && (
                            <div className="overflow-auto max-h-96 table-container">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Site Type
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {isLoadingUsers ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                        <span className="ml-2">Loading users...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    {userSearchTerm ? 'No users found matching your search' : 'No users found'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${isCurrentUser(user) ? 'bg-blue-50' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        <div className="flex items-center">
                                                            {`${user.first_name} ${user.last_name}`}
                                                            {isCurrentUser(user) && (
                                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {getFullRoleName(user.role)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.primarysite === site?.name ? 'Primary' : 'Assigned'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex space-x-3">
                                                            <button
                                                                onClick={() => handleEditUser(user)}
                                                                className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                                                                title="Edit user"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            {!isCurrentUser(user) && (
                                                                <button
                                                                    onClick={() => {
                                                                        setUserToDelete(user);
                                                                        setIsDeleteModalOpen(true);
                                                                    }}
                                                                    className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                                                                    title="Delete user"
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Patients Table */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className={`p-4 ${expandedSections.patients ? 'border-b border-gray-200' : ''}`}>
                            <div 
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => toggleSection('patients')}
                            >
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <UserSquare2 className="w-5 h-5 text-blue-600" />
                                    Patients
                                    {expandedSections.patients ? (
                                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )}
                                </h2>
                                {expandedSections.patients && (
                                    <div className="flex items-center gap-4">
                                        {/* Status Filter */}
                                        <div className="relative">
                                            <select
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border appearance-none"
                                            >
                                                <option value="all">All Patients</option>
                                                <option value="active">Active Only</option>
                                                <option value="inactive">Inactive Only</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                            </div>
                                        </div>

                                        <button
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Patient
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {expandedSections.patients && (
                            <div className="overflow-auto max-h-96 table-container">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Building
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Last Activity
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                No patients found
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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

            {/* Add User Modal */}
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onUserAdded={handleUserUpdated}
                defaultPrimarySite={site?.name}
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={isEditUserModalOpen}
                onClose={handleCloseEditUserModal}
                user={selectedUser}
                onUserUpdated={handleUserUpdated}
            />

            {/* Delete User Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen && userToDelete !== null}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                }}
                onConfirm={handleDeleteUser}
                isDeleting={isDeletingUser}
                itemName={userToDelete ? `user ${userToDelete.first_name} ${userToDelete.last_name}` : 'user'}
            />
        </div>
    );
}
