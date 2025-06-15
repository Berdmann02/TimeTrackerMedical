import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { getMedicalRecordsByPatientId, type MedicalRecord } from '../services/medicalRecordService';

interface StatusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string | number;
}

const StatusHistoryModal: React.FC<StatusHistoryModalProps> = ({ isOpen, onClose, patientId }) => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchMedicalRecords();
    }
  }, [isOpen, patientId]);

  const fetchMedicalRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await getMedicalRecordsByPatientId(patientId);
      setMedicalRecords(records);
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError('Failed to load medical records history');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getStatusLabel = (key: keyof MedicalRecord): string => {
    const labels: Record<string, string> = {
      bpAtGoal: 'BP at Goal',
      hospitalVisitSinceLastReview: 'Hospital Visit Since Last Review',
      a1cAtGoal: 'A1C at Goal',
      benzodiazepines: 'Benzodiazepines',
      antipsychotics: 'Antipsychotics',
      opioids: 'Opioids',
      fallSinceLastVisit: 'Fall Since Last Visit',
      medical_records: 'Medical Records'
    };
    return labels[key] || key;
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section - Fixed */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Clock className="h-6 w-6 mr-2" />
                Status Update History
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                View the history of updates to patient status fields.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              {error}
            </div>
          ) : medicalRecords.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No status updates found
            </div>
          ) : (
            <div className="space-y-4">
              {medicalRecords.map((record, index) => (
                <div 
                  key={record.id || index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-900">
                      Update #{medicalRecords.length - index}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(record.createdAt)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(record)
                      .filter(([key]) => key !== 'id' && key !== 'patientId' && key !== 'createdAt')
                      .map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{getStatusLabel(key as keyof MedicalRecord)}:</span>
                          <span className={`text-sm font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                            {value ? 'Yes' : 'No'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusHistoryModal;
