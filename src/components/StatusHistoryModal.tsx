import { Clock, X, User, Calendar, Activity } from 'lucide-react';

interface StatusUpdate {
  activityNumber: string;
  date: string;
  time: string;
  medicalRecords: string;
  bpAtGoal: string;
  hospitalVisit: string;
  a1cAtGoal: string;
  benzodiazepines: string;
  antipsychotics: string;
  opioids: string;
  fallSinceLastVisit: string;
  updatedBy: string;
}

interface StatusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StatusHistoryModal: React.FC<StatusHistoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Static data for now
  const statusUpdates: StatusUpdate[] = [
    {
      activityNumber: '#001',
      date: '2024-01-15',
      time: '10:30 AM',
      medicalRecords: 'No',
      bpAtGoal: 'No',
      hospitalVisit: 'No',
      a1cAtGoal: 'No',
      benzodiazepines: 'No',
      antipsychotics: 'No',
      opioids: 'No',
      fallSinceLastVisit: 'No',
      updatedBy: 'DS'
    },
    {
      activityNumber: '#002',
      date: '2024-01-10',
      time: '2:15 PM',
      medicalRecords: 'No',
      bpAtGoal: 'Yes',
      hospitalVisit: 'No',
      a1cAtGoal: 'No',
      benzodiazepines: 'No',
      antipsychotics: 'No',
      opioids: 'No',
      fallSinceLastVisit: 'No',
      updatedBy: 'NJ'
    },
    {
      activityNumber: '#003',
      date: '2024-01-05',
      time: '9:45 AM',
      medicalRecords: 'Yes',
      bpAtGoal: 'No',
      hospitalVisit: 'Yes',
      a1cAtGoal: 'No',
      benzodiazepines: 'No',
      antipsychotics: 'No',
      opioids: 'No',
      fallSinceLastVisit: 'No',
      updatedBy: 'DW'
    }
  ];

  const formatFieldName = (key: string): string => {
    const fieldMap: Record<string, string> = {
      medicalRecords: 'Medical Records',
      bpAtGoal: 'BP at Goal',
      hospitalVisit: 'Hospital Visit',
      a1cAtGoal: 'A1C at Goal',
      benzodiazepines: 'Benzodiazepines',
      antipsychotics: 'Antipsychotics',
      opioids: 'Opioids',
      fallSinceLastVisit: 'Fall Since Last Visit'
    };
    return fieldMap[key] || key;
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Clock className="h-6 w-6 mr-2 text-blue-600" />
                Status Update History
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                View the chronological history of updates to patient status fields
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {statusUpdates.map((update, index) => (
              <div 
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      {/* <Activity className="h-5 w-5 text-blue-600" /> */}
                      <span className="text-lg font-semibold text-blue-600">
                        {update.activityNumber}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* <Calendar className="h-4 w-4 text-gray-500" /> */}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(update.date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">{update.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{update.updatedBy}</span>
                  </div>
                </div>

                {/* Medical Fields Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(update)
                    .filter(([key]) => !['activityNumber', 'date', 'time', 'updatedBy'].includes(key))
                    .map(([key, value]) => {
                      const fieldName = formatFieldName(key);
                      
                      return (
                        <div 
                          key={key}
                          className=""
                        >
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            {fieldName}
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {value}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusHistoryModal;
