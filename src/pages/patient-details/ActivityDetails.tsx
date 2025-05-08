import type { FC } from 'react';
import type { IconType } from 'react-icons';
import { 
    HiOutlineClock,
    HiOutlineUser,
    HiOutlineOfficeBuilding,
    HiOutlineUserGroup,
    HiOutlineClipboardCheck,
    HiOutlineHeart,
    HiOutlineOfficeBuilding as HospitalIcon,
    HiOutlineBeaker,
    HiOutlineExclamationCircle,
    HiOutlineBadgeCheck
} from 'react-icons/hi';

interface ActivityDetails {
    dateTime: string;
    patientName: string;
    siteName: string;
    personnelInitials: string;
    activityType: string;
    notes: string;
    medicalRecordsCompleted: boolean;
    bpAtGoal: boolean;
    hospitalVisited: boolean;
    a1cAtGoal: string;
    fallSinceLastVisit: boolean;
    useBenzo: boolean;
    useAntipsychotic: boolean;
    useOpioids: boolean;
}

const ActivityDetailsPage: FC = () => {
    // Sample data - replace with actual data fetching
    const activityDetails: ActivityDetails = {
        dateTime: '04/27/2025 12:54:14',
        patientName: 'John Doe',
        siteName: 'Main Clinic',
        personnelInitials: 'JD',
        activityType: 'Assess medical - functional - psychosocial needs',
        notes: 'Regular checkup - ClinRx core',
        medicalRecordsCompleted: false,
        bpAtGoal: true,
        hospitalVisited: false,
        a1cAtGoal: 'N/A',
        fallSinceLastVisit: false,
        useBenzo: false,
        useAntipsychotic: false,
        useOpioids: false,
    };

    const DetailRow: FC<{ icon: any; label: string; value: string | boolean }> = ({
        icon: Icon,
        label,
        value
    }) => (
        <div className="flex items-center p-4 border-b border-gray-200 hover:bg-gray-50">
            <Icon className="h-5 w-5 text-gray-500 mr-4" />
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-base text-gray-900">
                    {typeof value === 'boolean' ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {value ? 'Yes' : 'No'}
                        </span>
                    ) : (
                        value
                    )}
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">Activity Details</h1>
                    </div>

                    <div className="divide-y divide-gray-200">
                        <DetailRow
                            icon={HiOutlineClock}
                            label="Date and Time of Service"
                            value={activityDetails.dateTime}
                        />
                        <DetailRow
                            icon={HiOutlineUser}
                            label="Patient Name"
                            value={activityDetails.patientName}
                        />
                        <DetailRow
                            icon={HiOutlineOfficeBuilding}
                            label="Site Name"
                            value={activityDetails.siteName}
                        />
                        <DetailRow
                            icon={HiOutlineUserGroup}
                            label="Personnel Initials"
                            value={activityDetails.personnelInitials}
                        />
                        <DetailRow
                            icon={HiOutlineClipboardCheck}
                            label="Activity Type"
                            value={activityDetails.activityType}
                        />
                        <DetailRow
                            icon={HiOutlineClipboardCheck}
                            label="Notes"
                            value={activityDetails.notes}
                        />
                        <DetailRow
                            icon={HiOutlineClipboardCheck}
                            label="Medical Records Completed"
                            value={activityDetails.medicalRecordsCompleted}
                        />
                        <DetailRow
                            icon={HiOutlineHeart}
                            label="BP at Goal"
                            value={activityDetails.bpAtGoal}
                        />
                        <DetailRow
                            icon={HospitalIcon}
                            label="Hospital Visited Since Last Review"
                            value={activityDetails.hospitalVisited}
                        />
                        <DetailRow
                            icon={HiOutlineBeaker}
                            label="A1C at Goal"
                            value={activityDetails.a1cAtGoal}
                        />
                        <DetailRow
                            icon={HiOutlineExclamationCircle}
                            label="Fall Since Last Visit"
                            value={activityDetails.fallSinceLastVisit}
                        />
                        <DetailRow
                            icon={HiOutlineBadgeCheck}
                            label="Use Benzo"
                            value={activityDetails.useBenzo}
                        />
                        <DetailRow
                            icon={HiOutlineBadgeCheck}
                            label="Use Antipsychotic"
                            value={activityDetails.useAntipsychotic}
                        />
                        <DetailRow
                            icon={HiOutlineBadgeCheck}
                            label="Use Opioids"
                            value={activityDetails.useOpioids}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityDetailsPage;
