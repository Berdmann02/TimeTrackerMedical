import { Clock, X } from 'lucide-react';

interface StatusUpdate {
  field: string;
  activityId: string;
  updatedAt: string;
  updatedBy: string;
}

interface StatusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  updates: StatusUpdate[];
}

const StatusHistoryModal: React.FC<StatusHistoryModalProps> = ({ isOpen, onClose, updates }) => {
  if (!isOpen) return null;

  // Group updates by date
  const groupedUpdates = updates.reduce((acc, update) => {
    const date = new Date(update.updatedAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(update);
    return acc;
  }, {} as Record<string, StatusUpdate[]>);

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
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

          {/* Updates List */}
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {Object.entries(groupedUpdates).map(([date, dateUpdates]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500 sticky top-0 bg-white py-2">
                  {date}
                </h3>
                {dateUpdates.map((update, index) => (
                  <div 
                    key={`${update.activityId}-${index}`}
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors bg-white"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {update.field}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Activity #{update.activityId}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Updated by {update.updatedBy}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {new Date(update.updatedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
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
