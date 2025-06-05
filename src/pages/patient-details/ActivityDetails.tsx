import { useState, useEffect, memo } from 'react';
import type { FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Clock,
    User,
    Building2,
    Users,
    ClipboardCheck,
    Pencil,
    Trash2,
    ChevronLeft,
    Save,
    X,
    Calendar,
    Timer,
    TimerOff
} from 'lucide-react';
import { getActivityById, deleteActivity, updateActivity, getActivityTypes } from '../../services/activityService';
import type { Activity as BaseActivity } from '../../services/activityService';
import { getPatientById } from '../../services/patientService';
import { getSites, type Site } from '../../services/siteService';
import { getBuildingsBySiteId, type Building } from '../../services/buildingService';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import axios from 'axios';
import { API_URL } from '../../config';

// Extended Activity interface for this component to handle all the fields used in the UI
interface Activity extends BaseActivity {
  personnel_initials?: string;
  time_spent?: number;
  is_pharmacist?: boolean;
  building_name?: string;
  end_time?: string;
  site_start_time?: string;
  site_end_time?: string;
  personnel_start_time?: string;
  personnel_end_time?: string;
  activity_start_time?: string;
  activity_end_time?: string;
  notes_start_time?: string;
  notes_end_time?: string;
}

interface DetailRowProps {
    icon: any;
    label: string;
    value: string | boolean | number | null | undefined;
    startTime?: string;
    endTime?: string;
    isEditing?: boolean;
    onEdit?: (value: any) => void;
    onStartTimeEdit?: (value: string) => void;
    onEndTimeEdit?: (value: string) => void;
    editOptions?: string[];
    editType?: 'text' | 'number' | 'boolean' | 'select' | 'datetime' | 'readonly';
    calculateTimeDifference?: () => number;
    placeholder?: string;
    helperText?: string;
    activity?: Activity;
    userFullName?: string;
}

// Move DetailRow component outside of the main component and wrap with memo
const DetailRow: FC<DetailRowProps> = memo(({
    icon: Icon,
    label,
    value,
    startTime,
    endTime,
    isEditing = false,
    onEdit,
    onStartTimeEdit,
    onEndTimeEdit,
    editOptions = [],
    editType = 'text',
    calculateTimeDifference = () => 0,
    placeholder,
    helperText,
    activity,
    userFullName
}) => {
    // Helper function to format time values
    const formatTimeValue = (timeValue: number): string => {
        const totalMinutes = Math.floor(timeValue);
        const seconds = Math.round((timeValue - totalMinutes) * 60);
        
        if (totalMinutes === 0 && seconds === 0) {
            return "0 minutes";
        } else if (totalMinutes === 0) {
            return `${seconds} seconds`;
        } else if (seconds === 0) {
            return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
        } else {
            return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
    };

    return (
        <div className="flex items-start space-x-3 py-3">
            <Icon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
                {isEditing && editType !== 'readonly' ? (
                    <>
                        {editType === 'text' && (
                            <input
                                type="text"
                                value={String(value || '')}
                                onChange={(e) => onEdit?.(e.target.value)}
                                placeholder={placeholder}
                                className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        )}
                        {editType === 'number' && (
                            <input
                                type="number"
                                value={Number(value) || 0}
                                onChange={(e) => onEdit?.(parseFloat(e.target.value) || 0)}
                                placeholder={placeholder}
                                step="0.01"
                                min="0"
                                className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        )}
                        {editType === 'select' && (
                            <select
                                value={String(value || '')}
                                onChange={(e) => onEdit?.(e.target.value)}
                                className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select {label}</option>
                                {editOptions?.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}
                        {editType === 'boolean' && (
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={Boolean(value)}
                                    onChange={(e) => onEdit?.(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    {Boolean(value) ? 'Yes' : 'No'}
                                </span>
                            </div>
                        )}
                        {editType === 'datetime' && (
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        value={startTime ? new Date(startTime).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => onStartTimeEdit?.(new Date(e.target.value).toISOString())}
                                        className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">End Time</label>
                                    <input
                                        type="datetime-local"
                                        value={endTime ? new Date(endTime).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => onEndTimeEdit?.(new Date(e.target.value).toISOString())}
                                        className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                {startTime && endTime && calculateTimeDifference && (
                                    <div className="text-sm text-blue-600 font-medium">
                                        Duration: {formatTimeValue(calculateTimeDifference())}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-2">
                        <p className="text-base text-gray-900 font-medium">
                            {value === null || value === undefined ? (
                                'N/A'
                            ) : typeof value === 'number' && label === "Total Time" ? (
                                formatTimeValue(value)
                            ) : typeof value === 'number' ? (
                                formatTimeValue(value)
                            ) : label === "Personnel Initials" ? (
                                <div className="relative inline-block group">
                                    <span>{activity?.user_initials || activity?.personnel_initials || String(value).replace('0', '')}</span>
                                    {activity?.user_id && (
                                        <div className="absolute left-0 -top-2 transform -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none">
                                            <div className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
                                                {userFullName}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                value
                            )}
                        </p>
                        {(startTime || endTime) && (
                            <div className="text-sm text-gray-600 space-y-1">
                                {startTime && (
                                    <div className="flex items-center space-x-2">
                                        <Timer className="h-4 w-4" />
                                        <span>Start: {new Date(startTime).toLocaleString()}</span>
                                    </div>
                                )}
                                {endTime && (
                                    <div className="flex items-center space-x-2">
                                        <TimerOff className="h-4 w-4" />
                                        <span>End: {new Date(endTime).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {helperText && (
                    <p className="text-xs text-gray-500 mt-1">{helperText}</p>
                )}
            </div>
        </div>
    );
});

const ActivityDetailsPage: FC = () => {
    const { activityId } = useParams<{ activityId: string }>();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activity, setActivity] = useState<Activity | null>(null);
    const [patient, setPatient] = useState<any>(null);
    const [patientName, setPatientName] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedActivity, setEditedActivity] = useState<Activity | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activityTypes, setActivityTypes] = useState<string[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [sites, setSites] = useState<Site[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);

    useEffect(() => {
        const fetchActivityData = async () => {
            if (!activityId) {
                setError("No activity ID provided");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Fetch activity data
                const activityData = await getActivityById(activityId);
                
                if (Array.isArray(activityData)) {
                    setError("Unexpected data format");
                    return;
                }

                setActivity(activityData);
                setEditedActivity(activityData);

                // Fetch patient data
                if (activityData.patient_id) {
                    try {
                        const patientData = await getPatientById(activityData.patient_id);
                        setPatient(patientData);
                        setPatientName(`${patientData.first_name} ${patientData.last_name}`);
                    } catch (patientErr) {
                        console.error("Error fetching patient data:", patientErr);
                        setPatientName("Unknown Patient");
                    }
                }

                // Fetch activity types
                try {
                    const types = await getActivityTypes();
                    setActivityTypes(types);
                } catch (typesErr) {
                    console.error("Error fetching activity types:", typesErr);
                }

                // Fetch sites
                try {
                    const sitesData = await getSites();
                    setSites(sitesData);
                } catch (sitesErr) {
                    console.error("Error fetching sites:", sitesErr);
                }

            } catch (err) {
                console.error("Error fetching activity data:", err);
                setError("Failed to load activity data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivityData();
    }, [activityId]);

    // Load buildings when activity site changes or when editing starts
    useEffect(() => {
        const loadBuildings = async () => {
            if (!editedActivity?.site_name || !sites.length) return;

            try {
                // Find the site by name to get its ID
                const selectedSite = sites.find(site => site.name === editedActivity.site_name);
                if (selectedSite) {
                    const buildingsData = await getBuildingsBySiteId(selectedSite.id);
                    setBuildings(buildingsData);
                }
            } catch (err) {
                console.error("Error fetching buildings:", err);
            }
        };

        loadBuildings();
    }, [editedActivity?.site_name, sites]);

    const handleEdit = () => {
        // Prevent scrolling when entering edit mode
        const currentScrollPosition = window.scrollY;
        setIsEditing(true);
        // Restore scroll position after state update
        setTimeout(() => {
            window.scrollTo({
                top: currentScrollPosition,
                behavior: 'auto'
            });
        }, 0);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Reset to original data
        setEditedActivity(activity);
    };

    const handleStartTime = () => {
        if (!editedActivity) return;

        const now = new Date().toISOString();
        setEditedActivity(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                service_datetime: now,
                created_at: now
            };
        });
        setIsTracking(true);
    };

    const handleEndTime = () => {
        if (!isTracking || !editedActivity) return;

        const now = new Date().toISOString();
        const startTime = editedActivity.service_datetime || editedActivity.created_at || '';
        const endTime = now;
        const durationMinutes = Math.max(0, (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60));

        setEditedActivity(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                end_time: endTime,
                time_spent: durationMinutes,
                duration_minutes: durationMinutes
            };
        });
        setIsTracking(false);
    };

    const calculateTimeDifference = (): number => {
        if (!editedActivity) return 0;

        // Use time_spent if available, otherwise fall back to duration_minutes
        if (editedActivity.time_spent !== undefined && typeof editedActivity.time_spent === 'number') {
            return editedActivity.time_spent;
        }

        if (editedActivity.duration_minutes !== undefined && typeof editedActivity.duration_minutes === 'number') {
            return editedActivity.duration_minutes;
        }

        return 0;
    };

    const handleSave = async () => {
        if (!activityId || !editedActivity) return;

        setIsSaving(true);

        try {
            // Create properly formatted data for backend
            const timeSpent = typeof editedActivity.time_spent === 'number' ?
                editedActivity.time_spent :
                (typeof editedActivity.duration_minutes === 'number' ?
                    editedActivity.duration_minutes : 0);

            // Use patient's actual site and building information
            const updateData = {
                id: Number(activityId),
                patient_id: editedActivity.patient_id,
                activity_type: editedActivity.activity_type,
                personnel_initials: editedActivity.personnel_initials || editedActivity.user_initials || '',
                pharm_flag: Boolean(editedActivity.pharm_flag || editedActivity.is_pharmacist),
                notes: editedActivity.notes || '',
                site_name: patient?.site_name || editedActivity.site_name || '',
                building: patient?.building || editedActivity.building || editedActivity.building_name || '',
                service_datetime: editedActivity.service_datetime || editedActivity.created_at || new Date().toISOString(),
                duration_minutes: timeSpent
            };

            console.log('Updating activity with data:', updateData);
            const updatedActivity = await updateActivity(activityId, updateData);
            setActivity(updatedActivity);
            setEditedActivity(updatedActivity);
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating activity:", err);
            alert("Failed to update activity. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        if (!editedActivity) return;

        // Special handling for personnel initials
        if (field === 'personnel_initials' || field === 'user_initials') {
            // If the value is a full name (contains a space), generate initials
            if (typeof value === 'string' && value.includes(' ')) {
                const nameParts = value.split(' ');
                if (nameParts.length >= 2) {
                    const firstName = nameParts[0];
                    const lastName = nameParts[nameParts.length - 1];
                    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                    setEditedActivity(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            personnel_initials: initials,
                            user_initials: initials
                        };
                    });
                    return;
                }
            }
        }

        setEditedActivity(prev => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    };

    const handleDelete = async () => {
        if (!activityId || !activity) return;

        try {
            setIsDeleting(true);
            await deleteActivity(activityId);

            // Navigate back to patient details
            if (activity.patient_id) {
                navigate(`/patientdetails/${activity.patient_id}`);
            } else {
                navigate('/patients');
            }
        } catch (err) {
            console.error("Error deleting activity:", err);
            alert("Failed to delete activity. Please try again.");
            setIsDeleting(false);
        }
    };

    const handleBack = () => {
        // Navigate back to patient details if we have a patient_id
        if (activity && activity.patient_id) {
            navigate(`/patientdetails/${activity.patient_id}`);
        } else {
            navigate('/patients');
        }
    };

    // Add logging for the DetailRow render
    const renderDetailRow = (props: DetailRowProps) => {
        console.log('Rendering DetailRow with props:', props);
        return <DetailRow {...props} />;
    };

    // Format time spent
    const formatTimeSpent = (activity: Activity): string => {
        let timeValue = 0;
        if (activity.time_spent !== undefined && activity.time_spent !== null && !isNaN(Number(activity.time_spent))) {
            timeValue = Number(activity.time_spent);
        } else if (activity.duration_minutes !== undefined && activity.duration_minutes !== null && !isNaN(Number(activity.duration_minutes))) {
            timeValue = Number(activity.duration_minutes);
        }
        
        const totalMinutes = Math.floor(timeValue);
        const seconds = Math.round((timeValue - totalMinutes) * 60);
        
        if (totalMinutes === 0 && seconds === 0) {
            return "0 minutes";
        } else if (totalMinutes === 0) {
            return `${seconds} seconds`;
        } else if (seconds === 0) {
            return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
        } else {
            return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading activity data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !activity || !editedActivity) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                    <div className="text-red-600 mb-4 text-5xl">!</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Activity</h2>
                    <p className="text-gray-600 mb-4">{error || "Activity data not found"}</p>
                    <button
                        onClick={() => navigate('/patients')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Return to Patients List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                itemName={`Activity #${activityId}`}
            />
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBack}
                                className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                title="Back"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">Activity #{activityId} Details</h1>
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
                                <>
                                    <button
                                        onClick={handleEdit}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit Activity
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        disabled={isDeleting}
                                        className={`inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium ${isDeleting ? 'text-gray-400 cursor-not-allowed' : 'text-red-700 hover:bg-red-50 cursor-pointer'
                                            } bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
                            <DetailRow
                                icon={Clock}
                                label="Date and Time of Service"
                                value=""
                                startTime="2024-03-20T09:00:00"
                                endTime="2024-03-20T10:30:00"
                                isEditing={isEditing}
                                editType="datetime"
                                onStartTimeEdit={(value) => {
                                    handleFieldChange('service_datetime', value);
                                    handleFieldChange('created_at', value);
                                }}
                                onEndTimeEdit={(value) => handleFieldChange('end_time', value)}
                                calculateTimeDifference={calculateTimeDifference}
                            />
                            <DetailRow
                                icon={User}
                                label="Patient Name"
                                value={patientName || 'Unknown Patient'}
                                isEditing={isEditing}
                                editType="readonly"
                                calculateTimeDifference={calculateTimeDifference}
                            />
                            <DetailRow
                                icon={Building2}
                                label="Site Name"
                                value={editedActivity.site_name || 'CP Greater San Antonio'}
                                startTime={editedActivity.site_start_time}
                                endTime={editedActivity.site_end_time}
                                isEditing={isEditing}
                                editType="select"
                                editOptions={sites.map(site => site.name)}
                                onEdit={(value) => handleFieldChange('site_name', value)}
                                onStartTimeEdit={(value) => handleFieldChange('site_start_time', value)}
                                onEndTimeEdit={(value) => handleFieldChange('site_end_time', value)}
                                calculateTimeDifference={calculateTimeDifference}
                            />
                            <DetailRow
                                icon={Building2}
                                label="Building"
                                value={editedActivity.building || editedActivity.building_name || 'Main Medical Center'}
                                isEditing={isEditing}
                                editType="select"
                                editOptions={buildings.map(building => building.name)}
                                onEdit={(value) => handleFieldChange('building', value)}
                                calculateTimeDifference={calculateTimeDifference}
                            />
                            <DetailRow
                                icon={Users}
                                label="Personnel Initials"
                                value={editedActivity.personnel_initials || editedActivity.user_initials || 'Unknown'}
                                startTime={editedActivity.personnel_start_time}
                                endTime={editedActivity.personnel_end_time}
                                isEditing={false}
                                editType="readonly"
                                onStartTimeEdit={(value) => handleFieldChange('personnel_start_time', value)}
                                onEndTimeEdit={(value) => handleFieldChange('personnel_end_time', value)}
                                activity={activity}
                                userFullName={editedActivity.user_initials || 'Unknown'}
                            />
                            <DetailRow
                                icon={ClipboardCheck}
                                label="Activity Type"
                                value={editedActivity.activity_type || ''}
                                startTime={editedActivity.activity_start_time}
                                endTime={editedActivity.activity_end_time}
                                isEditing={isEditing}
                                editType="select"
                                editOptions={activityTypes}
                                onEdit={(value) => handleFieldChange('activity_type', value)}
                                onStartTimeEdit={(value) => handleFieldChange('activity_start_time', value)}
                                onEndTimeEdit={(value) => handleFieldChange('activity_end_time', value)}
                                calculateTimeDifference={calculateTimeDifference}
                            />
                            <DetailRow
                                icon={Clock}
                                label="Total Time"
                                value={formatTimeSpent(editedActivity)}
                                isEditing={isEditing}
                                editType="number"
                                onEdit={(value) => {
                                    handleFieldChange('time_spent', value);
                                    handleFieldChange('duration_minutes', value);
                                }}
                            />
                            <DetailRow
                                icon={ClipboardCheck}
                                label="Notes"
                                value={editedActivity.notes || ''}
                                startTime={editedActivity.notes_start_time}
                                endTime={editedActivity.notes_end_time}
                                isEditing={isEditing}
                                editType="text"
                                onEdit={(value) => handleFieldChange('notes', value)}
                                onStartTimeEdit={(value) => handleFieldChange('notes_start_time', value)}
                                onEndTimeEdit={(value) => handleFieldChange('notes_end_time', value)}
                                calculateTimeDifference={calculateTimeDifference}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityDetailsPage;
