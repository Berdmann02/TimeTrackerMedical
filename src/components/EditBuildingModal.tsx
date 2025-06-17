import React, { useState, useEffect, useRef } from 'react';
import { Building2, X } from 'lucide-react';
import { updateBuilding, type Building } from '../services/buildingService';

// Helper function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface EditBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Building | null;
  onBuildingUpdated: () => void;
}

export const EditBuildingModal: React.FC<EditBuildingModalProps> = ({
  isOpen,
  onClose,
  building,
  onBuildingUpdated,
}) => {
  const [buildingName, setBuildingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevIsOpen = useRef(isOpen);

  // Reset error when modal is closed
  useEffect(() => {
    // If modal was open and is now closed, reset error
    if (prevIsOpen.current && !isOpen) {
      setError(null);
      setIsSubmitting(false);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  // Add effect to manage body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Update form when building prop changes
  useEffect(() => {
    if (building) {
      setBuildingName(building.name);
    } else {
      setBuildingName('');
    }
    setError(null);
  }, [building]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!building) {
      setError('No building selected for editing');
      return;
    }

    // Validate building name
    if (!buildingName.trim()) {
      setError('Building name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateBuilding(building.id, {
        name: buildingName.trim(),
      });

      onBuildingUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header Section */}
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-gray-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Building
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Modify building details
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 sm:p-6 pt-0 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1">
                Building Name
              </label>
              <input
                type="text"
                value={buildingName}
                onChange={(e) => setBuildingName(capitalizeWords(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                required
                placeholder="Enter building name"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Building'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 