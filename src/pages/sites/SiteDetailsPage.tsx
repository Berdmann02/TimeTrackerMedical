import React, { useState, useEffect } from 'react';
import { Building2, ChevronLeft, Pencil, Save, X, ArrowUpIcon, ArrowDownIcon, ChevronDownIcon, Users, UserSquare2, Building, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSiteById, updateSite } from '../../services/siteService';
import type { Site } from '../../services/siteService';

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

export default function SiteDetailsPage() {
    const navigate = useNavigate();
    const { siteId } = useParams<{ siteId: string }>();
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [site, setSite] = useState<Site | null>(null);
    const [editedSite, setEditedSite] = useState<Site | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Add state for expandable sections
    const [expandedSections, setExpandedSections] = useState({
        buildings: true,
        employees: true,
        patients: true
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

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading site data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !site) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
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
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/sites')}
                            className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                            title="Back to All Sites"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Site Details</h1>
                    </div>
                    <div className="flex space-x-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleEditSite}
                                className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out cursor-pointer"
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Site
                            </button>
                        )}
                    </div>
                </div>

                {/* Site Information Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                    <div className="p-6">
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
                </div>

                {/* Expandable Tables Section */}
                <div className="space-y-6">
                    {/* Buildings Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6">
                            <div 
                                className="flex justify-between items-center mb-6 cursor-pointer"
                                onClick={() => toggleSection('buildings')}
                            >
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Building className="w-5 h-5 text-blue-600" />
                                    Buildings
                                    {expandedSections.buildings ? (
                                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )}
                                </h2>
                                {expandedSections.buildings && (
                                    <button
                                        className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out cursor-pointer"
                                    >
                                        Add Building
                                    </button>
                                )}
                            </div>
                            {expandedSections.buildings && (
                                <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Building Name
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Capacity
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No buildings found
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Employees Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6">
                            <div 
                                className="flex justify-between items-center mb-6 cursor-pointer"
                                onClick={() => toggleSection('employees')}
                            >
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Employees
                                    {expandedSections.employees ? (
                                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )}
                                </h2>
                                {expandedSections.employees && (
                                    <button
                                        className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out cursor-pointer"
                                    >
                                        Add Employee
                                    </button>
                                )}
                            </div>
                            {expandedSections.employees && (
                                <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Department
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
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No employees found
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Patients Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6">
                            <div 
                                className="flex justify-between items-center mb-6 cursor-pointer"
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
                                            className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out cursor-pointer"
                                        >
                                            Add Patient
                                        </button>
                                    </div>
                                )}
                            </div>
                            {expandedSections.patients && (
                                <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
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
            </div>
        </div>
    );
}
