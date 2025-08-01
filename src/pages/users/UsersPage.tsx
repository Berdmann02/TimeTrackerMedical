import { useState, useEffect, useMemo } from "react"
import { User, Pencil, Trash, Plus, Shield, ArrowDownIcon, ArrowUpIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import AddUserModal from "../../components/AddUserModal"
import EditUserModal from "../../components/EditUserModal"
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal"
import { getUsers, deleteUser, type UserListItem, type PaginatedUsersResponse } from "../../services/userService"
import { getSitesAndBuildings, type SiteWithBuildings } from "../../services/siteService"
import { useAuth } from "../../contexts/AuthContext"

// Interface for the user accounts in the table (based on UserListItem from backend)
interface UserAccount extends UserListItem {
  isActive: boolean;
}

// Interface matching EditUserModal's expected type
interface EditableUser {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "nurse" | "pharmacist";
  primarySite?: string;
  assignedSites?: string[];
}

export default function UsersPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<EditableUser | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for users data
  const [users, setUsers] = useState<UserAccount[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "nurse" | "pharmacist">("all")
  const [siteFilter, setSiteFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [usersPerPage] = useState(50)

  // State for sites data
  const [sitesAndBuildings, setSitesAndBuildings] = useState<SiteWithBuildings[]>([])

  // Fetch users data
  const fetchUsersData = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data: PaginatedUsersResponse = await getUsers(
        page, 
        usersPerPage,
        searchTerm || undefined,
        roleFilter !== "all" ? roleFilter : undefined,
        siteFilter !== "all" ? siteFilter : undefined,
        sortField,
        sortDirection
      );
      
      // Transform the users to include isActive property
      const transformedUsers = data.users.map((user) => ({
        ...user,
        isActive: true // You might want to determine this based on some criteria from your API
      }));
      
      setUsers(transformedUsers);
      setTotalUsers(data.total);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sites and buildings data in the background
  const fetchSitesAndBuildingsData = async () => {
    try {
      const data = await getSitesAndBuildings();
      setSitesAndBuildings(data);
    } catch (err) {
      console.error('Error fetching sites and buildings:', err);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchUsersData();
    fetchSitesAndBuildingsData(); // Load in background without loading state
  }, []);

  // Get all unique site names
  const siteNames = useMemo(() => {
    return sitesAndBuildings.map(site => site.site_name);
  }, [sitesAndBuildings]);

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchUsersData(newPage);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Helper function to check if user is the current user
  const isCurrentUser = (user: UserAccount) => {
    return currentUser && user.email === currentUser.email;
  };

  const handleEdit = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user && user.id) {
      // Parse the name back to first and last name
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setSelectedUser({
        id: user.id.toString(), // Use actual user ID from backend
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        role: user.role,
        primarySite: user.primary_site,
        assignedSites: user.assigned_sites
      });
      setIsEditUserModalOpen(true);
    }
  };

  const handleUserUpdated = () => {
    fetchUsersData(currentPage); // Refresh the users list
  };

  const handleDelete = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete?.id) return;
    
    setIsDeleting(true);
    try {
      // Use actual user ID from backend
      await deleteUser(userToDelete.id);
      fetchUsersData(currentPage); // Refresh the list
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      // Show error in the modal or as a toast notification
      if (error instanceof Error) {
        setError(`Failed to delete user: ${error.message}`);
      } else {
        setError('Failed to delete user. Please try again.');
      }
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
  };

  const handleUserAdded = () => {
    fetchUsersData(currentPage); // Refresh the users list
    setIsAddUserModalOpen(false);
  };

  // Handle search and filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
    fetchUsersData(1);
  };

  const handleRoleFilterChange = (value: "all" | "admin" | "nurse" | "pharmacist") => {
    setRoleFilter(value);
    setCurrentPage(1); // Reset to first page
    fetchUsersData(1);
  };

  const handleSiteFilterChange = (value: string) => {
    setSiteFilter(value);
    setCurrentPage(1); // Reset to first page
    fetchUsersData(1);
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startUser = (currentPage - 1) * usersPerPage + 1;
  const endUser = Math.min(currentPage * usersPerPage, totalUsers);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <div className="flex-1 flex flex-col px-4 py-6 max-w-7xl mx-auto w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 flex-shrink-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <button
              onClick={handleAddUser}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex-shrink-0">
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="relative w-full md:w-48">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                  <div className="relative">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "nurse" | "pharmacist")}
                      className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="nurse">Nurse</option>
                      <option value="pharmacist">Pharmacist</option>
                    </select>
                  </div>
                </div>
                <div className="relative w-full md:w-48">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Site</label>
                  <div className="relative">
                    <select
                      value={siteFilter}
                      onChange={(e) => setSiteFilter(e.target.value)}
                      className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                    >
                      <option value="all">All Sites</option>
                      {siteNames.map((siteName) => (
                        <option key={siteName} value={siteName}>
                          {siteName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading state for table */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 flex justify-center items-center max-h-[60vh]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <div className="text-gray-500">Loading users data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-6 max-w-7xl mx-auto w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex-shrink-0">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="relative w-full md:w-48">
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => handleRoleFilterChange(e.target.value as "all" | "admin" | "nurse" | "pharmacist")}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="nurse">Nurse</option>
                    <option value="pharmacist">Pharmacist</option>
                  </select>
                </div>
              </div>
              <div className="relative w-full md:w-48">
                <label className="block text-xs font-medium text-gray-700 mb-1">Site</label>
                <div className="relative">
                  <select
                    value={siteFilter}
                    onChange={(e) => handleSiteFilterChange(e.target.value)}
                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white border appearance-none"
                  >
                    <option value="all">All Sites</option>
                    {siteNames.map((siteName) => (
                      <option key={siteName} value={siteName}>
                        {siteName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4 flex-shrink-0">
            <p>{error}</p>
            <button 
              onClick={() => fetchUsersData(currentPage)} 
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Users Table */}
        {!error && (
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col max-h-[60vh] min-h-0">
            {/* Scrollable Table with Fixed Header */}
            <div className="flex-1 overflow-auto min-h-0">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center">
                        <span>Name</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                          <ArrowDownIcon className={`h-3 w-3 ${sortField === 'name' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('email')}>
                      <div className="flex items-center">
                        <span>Email</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon className={`h-3 w-3 ${sortField === 'email' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                          <ArrowDownIcon className={`h-3 w-3 ${sortField === 'email' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('role')}>
                      <div className="flex items-center">
                        <span>Role</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon className={`h-3 w-3 ${sortField === 'role' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                          <ArrowDownIcon className={`h-3 w-3 ${sortField === 'role' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('primarysite')}>
                      <div className="flex items-center">
                        <span>Primary Site</span>
                        <div className="ml-1 flex">
                          <ArrowUpIcon className={`h-3 w-3 ${sortField === 'primarysite' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                          <ArrowDownIcon className={`h-3 w-3 ${sortField === 'primarysite' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${isCurrentUser(user) ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          <span>{user.name}</span>
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
                        <div className="flex items-center">
                          <span className="capitalize">
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.primary_site || "Not assigned"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEdit(user.id!)}
                            className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                            title="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {!isCurrentUser(user) && (
                            <button
                              onClick={() => handleDelete(user.id!)}
                              className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                              title="Delete user"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer - Fixed */}
            <div className="flex-shrink-0 bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startUser}</span> to{" "}
                    <span className="font-medium">{endUser}</span> of{" "}
                    <span className="font-medium">{totalUsers}</span> results
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        itemName={userToDelete ? userToDelete.name : 'user'}
      />
    </div>
  )
}
