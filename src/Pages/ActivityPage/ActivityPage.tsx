import React, { useState } from 'react';
import { FaUser, FaHospital, FaClipboardList, FaClock, FaStickyNote, FaPlay, FaStop } from 'react-icons/fa';

interface ActivityPageProps {
  // Add any props if needed
}

const ActivityPage: React.FC<ActivityPageProps> = () => {
  const [formData, setFormData] = useState({
    patientId: '',
    siteId: '',
    activityType: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  const [isTracking, setIsTracking] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartTime = () => {
    const now = new Date().toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    setFormData(prev => ({
      ...prev,
      startTime: now
    }));
    setIsTracking(true);
  };

  const handleEndTime = () => {
    const now = new Date().toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    setFormData(prev => ({
      ...prev,
      endTime: now
    }));
    setIsTracking(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            New Activity
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient ID Field */}
            <div className="flex items-center space-x-6">
              <div className="w-40 flex items-center justify-end">
                <FaUser className="text-gray-500 mr-2 text-lg" />
                <label className="text-base font-medium text-gray-700">Patient ID</label>
              </div>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-3"
              >
                <option value="">Select Patient</option>
                <option value="doe-john">Doe, John</option>
                {/* Add more options as needed */}
              </select>
            </div>

            {/* Site ID Field */}
            <div className="flex items-center space-x-6">
              <div className="w-40 flex items-center justify-end">
                <FaHospital className="text-gray-500 mr-2 text-lg" />
                <label className="text-base font-medium text-gray-700">Site ID</label>
              </div>
              <select
                name="siteId"
                value={formData.siteId}
                onChange={handleInputChange}
                className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-3"
              >
                <option value="">Select Site</option>
                <option value="cp-san-antonio">CP Greater San Antonio</option>
                <option value="cp-intermountain">CP Intermountain</option>
                {/* Add more options as needed */}
              </select>
            </div>

            {/* Activity Type Field */}
            <div className="flex items-center space-x-6">
              <div className="w-40 flex items-center justify-end">
                <FaClipboardList className="text-gray-500 mr-2 text-lg" />
                <label className="text-base font-medium text-gray-700">Activity Type</label>
              </div>
              <select
                name="activityType"
                value={formData.activityType}
                onChange={handleInputChange}
                className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-3"
              >
                <option value="">Select Activity Type</option>
                <option value="assess-medical">Assess medical - functional - psychosocial needs</option>
                <option value="conduct-risk">Conduct risk assessment</option>
                <option value="coordinate-care">Coordinate Care with other service providers</option>
                <option value="discuss-monitor">Discuss and Monitor patients medical - functional - psychosocial condition</option>
                <option value="manage-transition">Manage care transition</option>
                <option value="medications-management">Medications management oversight</option>
                <option value="other">Other</option>
                <option value="medication-reconciliation">Perform medication reconciliation</option>
                <option value="provide-education">Provide education about chronic conditions & management</option>
                <option value="screen-preventive">Screen for preventive services</option>
                {/* Add more options as needed */}
              </select>
            </div>

            {/* Time Tracking Section */}
            <div className="flex items-center space-x-6">
              <div className="w-40 flex items-center justify-end">
                <FaClock className="text-gray-500 mr-2 text-lg" />
                <label className="text-base font-medium text-gray-700">Time Tracking</label>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={handleStartTime}
                    disabled={isTracking}
                    className={`flex items-center px-6 py-3 text-base font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isTracking 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                    }`}
                  >
                    <FaPlay className="mr-2" />
                    Start
                  </button>
                  {formData.startTime && (
                    <span className="text-base text-gray-600">
                      Started: {new Date(formData.startTime).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={handleEndTime}
                    disabled={!isTracking}
                    className={`flex items-center px-6 py-3 text-base font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      !isTracking 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                    }`}
                  >
                    <FaStop className="mr-2" />
                    End
                  </button>
                  {formData.endTime && (
                    <span className="text-base text-gray-600">
                      Ended: {new Date(formData.endTime).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Field */}
            <div className="flex items-start space-x-6">
              <div className="w-40 flex items-center justify-end">
                <FaStickyNote className="text-gray-500 mr-2 text-lg" />
                <label className="text-base font-medium text-gray-700">Notes</label>
              </div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={6}
                className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                placeholder="Enter any additional notes..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                className="px-6 py-3 text-base font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 text-base font-medium text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
