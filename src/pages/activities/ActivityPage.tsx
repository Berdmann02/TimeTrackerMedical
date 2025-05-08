import React, { useState } from "react";
import {
  FaUser,
  FaHospital,
  FaClipboardList,
  FaClock,
  FaStickyNote,
  FaPlay,
  FaStop,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface ActivityForm {
  patientId: string;
  siteId: string;
  activityType: string;
  startTime: string;
  endTime: string;
  notes: string;
}

const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ActivityForm>({
    patientId: "",
    siteId: "",
    activityType: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const [isTracking, setIsTracking] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStartTime = () => {
    const now = new Date().toISOString();
    setFormData((prev) => ({ ...prev, startTime: now }));
    setIsTracking(true);
  };

  const handleEndTime = () => {
    const now = new Date().toISOString();
    setFormData((prev) => ({ ...prev, endTime: now }));
    setIsTracking(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  const handleCancel = () => {
    navigate('/patients');
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="h-full w-full flex flex-col pt-6">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaClipboardList className="w-5 h-5 mr-2 text-gray-600" />
                Activity Details
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {/* Patient and Site Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Patient */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <FaUser className="w-4 h-4 text-gray-400 mr-2" />
                      Patient
                    </span>
                  </label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <option value="">Select Patient</option>
                    <option value="doe-john">Doe, John</option>
                  </select>
                </div>

                {/* Site */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <FaHospital className="w-4 h-4 text-gray-400 mr-2" />
                      Site Location
                    </span>
                  </label>
                  <select
                    name="siteId"
                    value={formData.siteId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <option value="">Select Site</option>
                    <option value="cp-san-antonio">CP Greater San Antonio</option>
                    <option value="cp-intermountain">CP Intermountain</option>
                  </select>
                </div>
              </div>

              {/* Activity Type */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <FaClipboardList className="w-4 h-4 text-gray-400 mr-2" />
                    Activity Type
                  </span>
                </label>
                <select
                  name="activityType"
                  value={formData.activityType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <option value="">Select Activity Type</option>
                  <option value="assess-medical">
                    Assess medical/functional/psychosocial needs
                  </option>
                  <option value="conduct-risk">Conduct risk assessment</option>
                  <option value="coordinate-care">
                    Coordinate care with other service providers
                  </option>
                  <option value="discuss-monitor">
                    Discuss & monitor patient condition
                  </option>
                  <option value="manage-transition">Manage care transition</option>
                  <option value="medications-management">
                    Medications management oversight
                  </option>
                  <option value="medication-reconciliation">
                    Perform medication reconciliation
                  </option>
                  <option value="provide-education">
                    Provide chronic‑condition education
                  </option>
                  <option value="screen-preventive">
                    Screen for preventive services
                  </option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Time Tracking */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <FaClock className="w-5 h-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Time Tracking
                  </h3>
                </div>

                <div className="flex justify-center">
                  <div className="flex gap-16 items-start">
                    {/* Start Time */}
                    <div className="flex flex-col items-center space-y-2">
                      <div>
                        <button
                          type="button"
                          onClick={handleStartTime}
                          disabled={isTracking}
                          className={`inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer ${
                            isTracking
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          }`}
                        >
                          <FaPlay className="w-4 h-4 mr-2" />
                          Start Timer
                        </button>
                      </div>
                      <div className="h-5">
                        {formData.startTime && (
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            Started: {new Date(formData.startTime).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* End Time */}
                    <div className="flex flex-col items-center space-y-2">
                      <div>
                        <button
                          type="button"
                          onClick={handleEndTime}
                          disabled={!isTracking}
                          className={`inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer ${
                            !isTracking
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                          }`}
                        >
                          <FaStop className="w-4 h-4 mr-2" />
                          Stop Timer
                        </button>
                      </div>
                      <div className="h-5">
                        {formData.endTime && (
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            Ended: {new Date(formData.endTime).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <FaStickyNote className="w-4 h-4 text-gray-400 mr-2" />
                    Additional Notes
                  </span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm resize-none hover:bg-gray-100 transition-colors"
                  placeholder="Add any relevant details or observations..."
                />
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                  >
                    Save Activity
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
