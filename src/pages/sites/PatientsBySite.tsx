import React, { useState, useEffect } from 'react';
import { UserSquare2, ChevronDownIcon, ChevronRight, Plus, SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../../services/patientService';
import { getPatientsBySiteName } from '../../services/patientService';
import AddPatientModal from '../../components/AddPatientModal';

interface PatientsBySiteProps {
    siteName: string;
    expanded: boolean;
    onToggle: () => void;
}

export const PatientsBySite: React.FC<PatientsBySiteProps> = ({ siteName, expanded, onToggle }) => {
    const navigate = useNavigate();
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [patientStatusFilter, setPatientStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            if (!siteName || !expanded) return;
            
            setIsLoadingPatients(true);
            try {
                const sitePatients = await getPatientsBySiteName(siteName);
                setPatients(sitePatients);
            } catch (err) {
                console.error("Error fetching patients:", err);
            } finally {
                setIsLoadingPatients(false);
            }
        };

        fetchPatients();
    }, [siteName, expanded]);

    const handlePatientAdded = () => {
        // Refresh the patients list after a new patient is added
        if (siteName) {
            const fetchPatients = async () => {
                setIsLoadingPatients(true);
                try {
                    const sitePatients = await getPatientsBySiteName(siteName);
                    setPatients(sitePatients);
                } catch (err) {
                    console.error("Error fetching patients:", err);
                } finally {
                    setIsLoadingPatients(false);
                }
            };
            fetchPatients();
        }
    };

    // Filter patients based on search term and status
    const filteredPatients = patients.filter(patient => {
        const matchesSearch = `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(patientSearchTerm.toLowerCase());
        const matchesStatus = patientStatusFilter === 'all' || 
            (patientStatusFilter === 'active' && patient.is_active) || 
            (patientStatusFilter === 'inactive' && !patient.is_active);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className={`p-6 ${expanded ? 'border-b border-gray-200' : ''}`}>
                <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={onToggle}
                >
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <UserSquare2 className="w-5 h-5 text-blue-600" />
                        Patients
                        {expanded ? (
                            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                    </h2>
                    {expanded && (
                        <div className="flex items-center space-x-4" onClick={e => e.stopPropagation()}>
                            {/* Status Filter */}
                            <div className="relative w-[150px]">
                                <select
                                    value={patientStatusFilter}
                                    onChange={(e) => setPatientStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
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

                            {/* Search Input */}
                            <div className="relative w-[200px]">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search patients..."
                                    value={patientSearchTerm}
                                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <button
                                onClick={() => setIsAddPatientModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer whitespace-nowrap"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Patient
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {expanded && (
                <div className="flex flex-col max-h-[60vh] min-h-0">
                    <div className="flex-1 overflow-auto min-h-0 table-container">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 sticky top-0 z-10">
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
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingPatients ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                <span className="ml-2">Loading patients...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                            {patientSearchTerm || patientStatusFilter !== 'all' 
                                                ? 'No patients found matching your search criteria' 
                                                : 'No patients found for this site'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPatients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <button
                                                    onClick={() => navigate(`/patientdetails/${patient.id}`)}
                                                    className="text-blue-600 hover:text-blue-900 hover:underline transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                                >
                                                    {`${patient.first_name} ${patient.last_name}`}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {patient.building || 'Not assigned'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    patient.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {patient.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex-shrink-0 bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <span className="text-sm text-gray-700">Patients</span>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{filteredPatients.length}</span> of{" "}
                                    <span className="font-medium">{filteredPatients.length}</span> patients
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Scroll to view more patients
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Patient Modal */}
            <AddPatientModal
                isOpen={isAddPatientModalOpen}
                onClose={() => setIsAddPatientModalOpen(false)}
                onPatientAdded={handlePatientAdded}
                defaultSite={siteName}
            />
        </div>
    );
}; 