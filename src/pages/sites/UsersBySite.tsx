import React, { useState } from 'react';
import { Users, ChevronDownIcon, ChevronRight, Plus, SearchIcon, Pencil, Trash } from 'lucide-react';
import type { UserListItem } from '../../services/userService';
import { getUsersBySiteId, deleteUser } from '../../services/userService';
import AddUserModal from '../../components/AddUserModal';
import EditUserModal from '../../components/EditUserModal';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { useAuth } from '../../contexts/AuthContext';

interface TransformedUser {
    id?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: "admin" | "nurse" | "pharmacist";
    primarySite?: string;
    assignedSites?: string[];
}

interface UsersBySiteProps {
    siteId: string;
    siteName?: string;
    expanded: boolean;
    onToggle: () => void;
}

export const UsersBySite: React.FC<UsersBySiteProps> = ({ siteId, siteName, expanded, onToggle }) => {
    const { user: currentUser } = useAuth();
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<TransformedUser | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);

    // Helper function to check if user is the current user
    const isCurrentUser = (user: UserListItem) => {
        return currentUser && user.email === currentUser.email;
    };

    // Function to get full role name
    const getFullRoleName = (role: string): string => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    // Helper function to determine if a user is assigned to this site
    const isUserAssignedToSite = (user: UserListItem, currentSiteName: string): boolean => {
        if (user.primary_site === currentSiteName) return true;
        if (user.assigned_sites && user.assigned_sites.includes(currentSiteName)) return true;
        return false;
    };

    // Helper function to get site type for user
    const getUserSiteType = (user: UserListItem, currentSiteName: string): string => {
        if (user.primary_site === currentSiteName) return 'Primary';
        if (user.assigned_sites && user.assigned_sites.includes(currentSiteName)) return 'Assigned';
        return 'Unknown';
    };

    const handleUserUpdated = () => {
        // Refresh the users list
        if (siteId && !isNaN(parseInt(siteId))) {
            getUsersBySiteId(parseInt(siteId)).then(setUsers);
        }
    };

    const handleEditUser = (user: UserListItem) => {
        // Parse the name back to first and last name
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const transformedUser = {
            id: user.id?.toString(),
            firstName: firstName,
            lastName: lastName,
            email: user.email,
            role: user.role as "admin" | "nurse" | "pharmacist",
            primarySite: user.primary_site,
            assignedSites: user.assigned_sites
        };
        setSelectedUser(transformedUser);
        setIsEditUserModalOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete?.id) return;
        
        setIsDeletingUser(true);
        try {
            await deleteUser(userToDelete.id);
            await handleUserUpdated(); // Refresh the list
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Failed to delete user. Please try again.");
        } finally {
            setIsDeletingUser(false);
        }
    };

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    ).sort((a, b) => {
        // Current user always comes first
        const aIsCurrentUser = isCurrentUser(a);
        const bIsCurrentUser = isCurrentUser(b);
        
        if (aIsCurrentUser && !bIsCurrentUser) return -1;
        if (!aIsCurrentUser && bIsCurrentUser) return 1;
        
        // If neither is current user, maintain alphabetical order
        return a.name.localeCompare(b.name);
    });

    React.useEffect(() => {
        const fetchUsers = async () => {
            if (!siteId || !expanded || isNaN(parseInt(siteId))) return;
            
            setIsLoadingUsers(true);
            try {
                const siteUsers = await getUsersBySiteId(parseInt(siteId));
                setUsers(siteUsers);
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [siteId, expanded]);

    return (
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <div className={`p-6 ${expanded ? 'border-b border-gray-200' : ''}`}>
                <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={onToggle}
                >
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Users
                        {expanded ? (
                            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                    </h2>
                    {expanded && (
                        <div className="flex items-center space-x-4" onClick={e => e.stopPropagation()}>
                            <div className="relative w-[200px]">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <button
                                onClick={() => setIsAddUserModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add User
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
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Site Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingUsers ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                <span className="ml-2">Loading users...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                            {userSearchTerm ? 'No users found matching your search' : 'No users found'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${isCurrentUser(user) ? 'bg-blue-50' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <div className="flex items-center">
                                                    {user.name}
                                                    {isCurrentUser(user) && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {getFullRoleName(user.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {siteName ? getUserSiteType(user, siteName) : 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                                                        title="Edit user"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    {!isCurrentUser(user) && (
                                                        <button
                                                            onClick={() => {
                                                                setUserToDelete(user);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                                                            title="Delete user"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex-shrink-0 bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <span className="text-sm text-gray-700">Users</span>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{filteredUsers.length}</span> of{" "}
                                    <span className="font-medium">{filteredUsers.length}</span> users
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Scroll to view more users
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onUserAdded={handleUserUpdated}
                defaultPrimarySiteId={siteId ? parseInt(siteId) : undefined}
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={isEditUserModalOpen}
                onClose={() => {
                    setIsEditUserModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onUserUpdated={handleUserUpdated}
            />

            {/* Delete User Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                }}
                onConfirm={handleDeleteUser}
                isDeleting={isDeletingUser}
                itemName={userToDelete ? `user ${userToDelete.name}` : 'user'}
            />
        </div>
    );
}; 