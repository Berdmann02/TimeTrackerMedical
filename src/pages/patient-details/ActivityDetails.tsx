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
import type { Activity } from '../../services/patientService';
import { getPatientById } from '../../services/patientService';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import axios from 'axios';
import { API_URL } from '../../config';

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
}) => (
    <div className="flex flex-col py-4 border-b border-gray-200">
        <div className="flex items-center mb-2">
            <Icon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        <div className="ml-7 space-y-3">
            {isEditing && editType !== 'readonly' ? (
                <>
                    {editType === 'text' && (
                        <input
                            type="text"
                            value={value as string || ''}
                            onChange={(e) => onEdit && onEdit(e.target.value)}
                            className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                            placeholder={placeholder}
                        />
                    )}
                    
                    {editType === 'number' && (
                        <input
                            type="number"
                            value={(() => {
                                const calculatedValue = calculateTimeDifference();
                                return typeof calculatedValue === 'number' ? calculatedValue : 0;
                            })()}
                            onChange={(e) => onEdit && onEdit(parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                            className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />
                    )}
                    
                    {editType === 'select' && (
                        <select
                            value={value as string || ''}
                            onChange={(e) => onEdit && onEdit(e.target.value)}
                            className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        >
                            {editOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    )}
                    
                    {editType === 'datetime' && (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Timer className="h-4 w-4 text-gray-500" />
                                <input
                                    type="datetime-local"
                                    value={startTime ? new Date(startTime).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => onStartTimeEdit && onStartTimeEdit(e.target.value)}
                                    className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <TimerOff className="h-4 w-4 text-gray-500" />
                                <input
                                    type="datetime-local"
                                    value={endTime ? new Date(endTime).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => onEndTimeEdit && onEndTimeEdit(e.target.value)}
                                    className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-2">
                    <p className="text-base text-gray-900 font-medium">
                        {value === null || value === undefined ? (
                            'N/A'
                        ) : typeof value === 'number' ? (
                            `${value.toFixed(2)} minutes`
                        ) : label === "Personnel Initials" ? (
                            <div className="relative inline-block group">
                                <span>{value}</span>
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
));

const ActivityDetailsPage: FC = () => {
    const { activityId } = useParams<{ activityId: string }>();
    const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activity, setActivity] = useState<Activity | null>(null);
    const [patientName, setPatientName] = useState<string>('');
    const [userInitials, setUserInitials] = useState<string>('');
    const [userFullName, setUserFullName] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedActivity, setEditedActivity] = useState<Activity | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activityTypes, setActivityTypes] = useState<string[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const fetchActivityData = async () => {
            if (!activityId) {
                setError("No activity ID provided");
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            setError(null);
            
            try {
                const activityData = await getActivityById(activityId);
                console.log('Fetched Activity Data:', activityData);
                setActivity(activityData);
                setEditedActivity(activityData);
                
                // Get the patient name if we have a patient ID
                if (activityData.patient_id) {
                    try {
                        const patient = await getPatientById(activityData.patient_id);
                        const fullName = `${patient.first_name} ${patient.last_name}`;
                        setPatientName(fullName);
                        console.log('Fetched Patient Data:', patient);
                    } catch (patientError) {
                        console.error("Error fetching patient data:", patientError);
                    }
                }

                // Get the user information if we have a user ID
                if (activityData.user_id) {
                    console.log('Fetching user data for user_id:', activityData.user_id);
                    try {
                        const response = await axios.get(`${API_URL}/users/${activityData.user_id}`);
                        const user = response.data;
                        console.log('Fetched User Data:', user);
                        const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
                        const fullName = `${user.first_name} ${user.last_name}`;
                        console.log('Generated User Initials:', initials);
                        setUserInitials(initials);
                        setUserFullName(fullName);
                        
                        // Update the activity with the user's initials
                        setEditedActivity(prev => {
                            if (!prev) return prev;
                            const updated = {
                                ...prev,
                                personnel_initials: initials,
                                user_initials: initials
                            };
                            console.log('Updated Activity with User Initials:', updated);
                            return updated;
                        });
                    } catch (userError) {
                        console.error("Error fetching user data:", userError);
                        setUserInitials('Unknown');
                        setUserFullName('Unknown User');
                    }
                } else {
                    console.log('No user_id found in activity data');
                }

                // Get activity types
                try {
                    const types = await getActivityTypes();
                    setActivityTypes(types);
                } catch (typesError) {
                    console.error("Error fetching activity types:", typesError);
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
            
            // Simplify to include only the fields the backend expects
            const updateData = {
                id: Number(activityId),
                patient_id: editedActivity.patient_id,
                activity_type: editedActivity.activity_type,
                personnel_initials: editedActivity.personnel_initials || editedActivity.user_initials || '',
                pharm_flag: Boolean(editedActivity.pharm_flag || editedActivity.is_pharmacist),
                notes: editedActivity.notes || '',
                site_name: editedActivity.site_name || 'CP Greater San Antonio',
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
                                        className={`inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium ${
                                            isDeleting ? 'text-gray-400 cursor-not-allowed' : 'text-red-700 hover:bg-red-50 cursor-pointer'
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
                                editOptions={['CP Greater San Antonio', 'CP Intermountain']}
                                onEdit={(value) => handleFieldChange('site_name', value)}
                                onStartTimeEdit={(value) => handleFieldChange('site_start_time', value)}
                                onEndTimeEdit={(value) => handleFieldChange('site_end_time', value)}
                                calculateTimeDifference={calculateTimeDifference}
                            />
                            <DetailRow
                                icon={Building2}
                                label="Building"
                                value="Main Medical Center"
                                isEditing={isEditing}
                                editType="select"
                                editOptions={[
                                    'Main Medical Center',
                                    'North Wing',
                                    'South Wing',
                                    'East Wing',
                                    'West Wing',
                                    'Emergency Department',
                                    'Outpatient Clinic'
                                ]}
                                onEdit={(value) => handleFieldChange('building', value)}
                                calculateTimeDifference={calculateTimeDifference}
                            />
                            <DetailRow
                                icon={Users}
                                label="Personnel Initials"
                                value={editedActivity.personnel_initials || editedActivity.user_initials || userInitials || ''}
                                startTime={editedActivity.personnel_start_time}
                                endTime={editedActivity.personnel_end_time}
                                isEditing={false}
                                editType="readonly"
                                onStartTimeEdit={(value) => handleFieldChange('personnel_start_time', value)}
                                onEndTimeEdit={(value) => handleFieldChange('personnel_end_time', value)}
                                activity={activity}
                                userFullName={userFullName}
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
                                value={editedActivity.time_spent ?? editedActivity.duration_minutes ?? 0}
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
