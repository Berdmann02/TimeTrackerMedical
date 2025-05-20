import { useState, useEffect } from "react"
import { User, Pencil, Trash, Plus, Shield } from "lucide-react"
import { useNavigate } from "react-router-dom"
import AddUserModal from "../../components/AddUserModal"
import EditUserModal from "../../components/EditUserModal"
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal"
import { getUsers, deleteUser } from "../../services/userService"
import type { User as UserType } from "../../services/userService"

interface UserAccount extends Omit<UserType, 'id'> {
  id?: number;
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
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<EditableUser | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [users, setUsers] = useState<UserAccount[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "a" | "U">("all")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const fetchedUsers = await getUsers()
      // Transform the users to include isActive property
      const transformedUsers = fetchedUsers.map(user => ({
        ...user,
        isActive: true // You might want to determine this based on some criteria from your API
      }))
      setUsers(transformedUsers)
    } catch (err) {
      setError("Failed to fetch users")
      console.error("Error fetching users:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleEdit = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser({
        id: user.id?.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role === 'a' ? 'admin' : user.role === 'p' ? 'pharmacist' : 'nurse',
        primarySite: user.primarysite,
        assignedSites: user.assignedsites
      });
      setIsEditUserModalOpen(true);
    }
  };

  const handleUserUpdated = () => {
    fetchUsers(); // Refresh the users list
  };

  const handleDelete = (userId: number) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setUserToDelete(user)
      setIsDeleteModalOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete?.id) return;
    
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setUsers(users.filter((user) => user.id !== userToDelete.id));
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
  }

  const handleAddUser = () => {
    setIsAddUserModalOpen(true)
  }

  const handleUserAdded = () => {
    fetchUsers(); // Refresh the users list
    setIsAddUserModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="w-full sm:w-48 flex-shrink-0">
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as "all" | "a" | "U")}
                  className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="a">Admin</option>
                  <option value="U">User</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Shield className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading users...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                      Primary Site
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          {`${user.first_name} ${user.last_name}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Shield className={`h-4 w-4 ${user.role === "a" ? "text-blue-500" : "text-gray-400"} mr-1`} />
                          <span>
                            {user.role === "a" ? "Admin" : 
                             user.role === "p" ? "Pharmacist" : 
                             user.role === "n" ? "Nurse" : "User"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.primarysite || "Not assigned"}
                      </td>
                      <td className="px-6 py-4 whitespac  e-nowrap text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
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
                          <button
                            onClick={() => handleDelete(user.id!)}
                            className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                            title="Delete user"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
        itemName={userToDelete ? `${userToDelete.first_name} ${userToDelete.last_name}` : 'user'}
      />
    </div>
  )
}
