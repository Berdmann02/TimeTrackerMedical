import React, { useState, useEffect } from 'react';
import { Building2, ChevronLeft, Pencil, Save, X, ArrowUpIcon, ArrowDownIcon, ChevronDownIcon, Users, UserSquare2, Building as BuildingIcon, ChevronRight, Plus, SearchIcon, Trash } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSiteById, updateSite, deleteSite } from '../../services/siteService';
import type { Site } from '../../services/siteService';
import { AddBuildingModal } from '../../components/AddBuildingModal';
import { EditBuildingModal } from '../../components/EditBuildingModal';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { getBuildingsBySiteId, deleteBuilding, type Building } from '../../services/buildingService';
import { getUsersBySiteId, deleteUser, type UserListItem } from '../../services/userService';
import { getPatientsBySiteId, type Patient } from '../../services/patientService';
import AddUserModal from '../../components/AddUserModal';
import EditUserModal from '../../components/EditUserModal';
import AddPatientModal from '../../components/AddPatientModal';
import { useAuth } from '../../contexts/AuthContext';
import { BuildingsBySite } from './BuildingsBySite';
import { UsersBySite } from './UsersBySite';
import { PatientsBySite } from './PatientsBySite';

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
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<TransformedUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [patientStatusFilter, setPatientStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
    const [isDeleteSiteModalOpen, setIsDeleteSiteModalOpen] = useState(false);
    const [isDeletingSite, setIsDeletingSite] = useState(false);

    // Add state for expandable sections
    const [expandedSections, setExpandedSections] = useState({
        buildings: false,
        users: false,
        patients: false
    });

    // Helper function to check if user is the current user - updated for new structure
    const isCurrentUser = (user: UserListItem) => {
        return currentUser && user.email === currentUser.email;
    };

    // Function to get full role name - updated for new role format
    const getFullRoleName = (role: string): string => {
        // The new backend returns full role names already
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    // Helper function to determine if a user is assigned to this site - updated for new structure
    const isUserAssignedToSite = (user: UserListItem, currentSiteName: string): boolean => {
        if (user.primary_site === currentSiteName) return true;
        if (user.assigned_sites && user.assigned_sites.includes(currentSiteName)) return true;
        return false;
    };

    // Helper function to get site type for user - updated for new structure
    const getUserSiteType = (user: UserListItem, currentSiteName: string): string => {
        if (user.primary_site === currentSiteName) return 'Primary';
        if (user.assigned_sites && user.assigned_sites.includes(currentSiteName)) return 'Assigned';
        return 'Unknown';
    };

    // Filter users based on search term - updated for new structure
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    ).sort((a, b) => {
        // Current user always comes first
        const aIsCurrentUser = isCurrentUser(a);
        const bIsCurrentUser = isCurrentUser(b);
        
        if (aIsCurrentUser && !bIsCurrentUser) return -1;
        if (!aIsCurrentUser && bIsCurrentUser) return 1;
        
        // If neither is current user, maintain alphabetical order
        return a.name.localeCompare(b.name);
    });

    // Add useEffect for fetching patients
    useEffect(() => {
        const fetchPatients = async () => {
            if (!siteId || !expandedSections.patients || isNaN(parseInt(siteId))) return;
            
            setIsLoadingPatients(true);
            try {
                const sitePatients = await getPatientsBySiteId(parseInt(siteId));
                setPatients(sitePatients);
            } catch (err) {
                console.error("Error fetching patients:", err);
            } finally {
                setIsLoadingPatients(false);
            }
        };

        fetchPatients();
    }, [siteId, expandedSections.patients]);

    // Filter patients based on search term and status
    const filteredPatients = patients.filter(patient => {
        const matchesSearch = `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(patientSearchTerm.toLowerCase());
        const matchesStatus = patientStatusFilter === 'all' || 
            (patientStatusFilter === 'active' && patient.is_active) || 
            (patientStatusFilter === 'inactive' && !patient.is_active);
        return matchesSearch && matchesStatus;
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
            if (!siteId || !expandedSections.users || isNaN(parseInt(siteId))) return;
            
            setIsLoadingUsers(true);
            try {
                const siteUsers = await getUsersBySiteId(parseInt(siteId));
                setUsers(siteUsers);
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [siteId, expandedSections.users]);

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
            // Only send editable fields, exclude read-only fields
            const updateData = {
                name: editedSite.name,
                address: editedSite.address,
                city: editedSite.city,
                state: editedSite.state,
                zip: editedSite.zip,
                is_active: editedSite.is_active
            };
            
            console.log('Updating site with data:', updateData);
            const updatedSite = await updateSite(parseInt(siteId, 10), updateData);
            console.log('Site updated successfully:', updatedSite);
            
            setSite(updatedSite);
            setEditedSite(updatedSite);
            setIsEditing(false);
        } catch (err: any) {
            console.error("Error updating site:", err);
            
            // Provide more specific error messages
            let errorMessage = "Failed to update site. Please try again.";
            if (err.response?.status === 404) {
                errorMessage = "Site not found. Please refresh the page and try again.";
            } else if (err.response?.status === 400) {
                errorMessage = "Invalid site data. Please check your inputs and try again.";
            } else if (err.response?.data?.message) {
                errorMessage = `Failed to update site: ${err.response.data.message}`;
            }
            
            alert(errorMessage);
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

    // User handlers - updated for new structure
    const handleEditUser = (user: UserListItem) => {
        // Parse the name back to first and last name
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const transformedUser = {
            id: user.id?.toString(),
            firstName: firstName,
            lastName: lastName,
            email: user.email,
            role: user.role as "admin" | "nurse" | "pharmacist",
            primarySite: user.primary_site,
            assignedSites: user.assigned_sites
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
        if (siteId && !isNaN(parseInt(siteId))) {
            getUsersBySiteId(parseInt(siteId)).then(setUsers);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete?.id) return;
        
        setIsDeletingUser(true);
        try {
            await deleteUser(userToDelete.id);
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

    const handlePatientAdded = () => {
        // Refresh the patients list after a new patient is added
        if (siteId && !isNaN(parseInt(siteId))) {
            const fetchPatients = async () => {
                setIsLoadingPatients(true);
                try {
                    const sitePatients = await getPatientsBySiteId(parseInt(siteId));
                    setPatients(sitePatients);
                } catch (err) {
                    console.error("Error fetching patients:", err);
                } finally {
                    setIsLoadingPatients(false);
                }
            };
            fetchPatients();
        }
    };

    const handleDeleteSite = async () => {
        if (!siteId) return;
        
        setIsDeletingSite(true);
        try {
            await deleteSite(parseInt(siteId, 10));
            navigate('/sites'); // Navigate back to sites list after successful deletion
        } catch (err) {
            console.error("Error deleting site:", err);
            alert("Failed to delete site. Please try again.");
        } finally {
            setIsDeletingSite(false);
        }
    };

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
                                    onClick={() => setIsDeleteSiteModalOpen(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors cursor-pointer"
                                >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete Site
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
                <BuildingsBySite
                    siteId={siteId || ''}
                    expanded={expandedSections.buildings}
                    onToggle={() => toggleSection('buildings')}
                />

                {/* Users Section */}
                <UsersBySite
                    siteId={siteId || ''}
                    siteName={site.name}
                    expanded={expandedSections.users}
                    onToggle={() => toggleSection('users')}
                />

                {/* Patients Section */}
                <PatientsBySite
                    siteName={site.name}
                    expanded={expandedSections.patients}
                    onToggle={() => toggleSection('patients')}
                />
            </div>

            {/* Delete Site Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteSiteModalOpen}
                onClose={() => setIsDeleteSiteModalOpen(false)}
                onConfirm={handleDeleteSite}
                isDeleting={isDeletingSite}
                itemName={`site "${site?.name}"`}
            />
        </div>
    );
}
