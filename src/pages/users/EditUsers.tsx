import { useState, type FormEvent, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Mail, Lock, Shield, ArrowLeft, UserX } from "lucide-react"

interface FormData {
  email: string
  password: string
  confirmPassword: string
  role: "admin" | "pharmacist" | "Nurse"
  isInactive: boolean
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  role?: string
}

export default function EditUsers() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    role: "Nurse",
    isInactive: false
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Here you would fetch the user data based on userId
    const fetchUser = async () => {
      try {
        // Simulate API call to get user data
        await new Promise(resolve => setTimeout(resolve, 500))
        // Mock user data - replace with actual API call
        setFormData({
          email: "user@example.com",
          password: "",
          confirmPassword: "",
          role: "Nurse",
          isInactive: false
        })
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    
    setFormData({
      ...formData,
      [name]: newValue
    })

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    // Password validation - only if password is being changed
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters"
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = "Role is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Here you would implement your user update logic
      console.log("Form submitted:", formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      navigate("/users")
    } catch (error) {
      console.error("User update failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate("/users")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Users
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-900">Edit User</h1>
            <p className="mt-1 text-sm text-gray-600">
              Modify user account details and permissions
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                <span className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  Email Address
                </span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full px-4 py-2.5 bg-gray-50 border ${
                  errors.email
                    ? "border-red-300 ring-red-300"
                    : "border-gray-300 focus:border-blue-500"
                } rounded-lg focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-colors duration-200`}
                placeholder="user@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                <span className="flex items-center">
                  <Lock className="h-4 w-4 text-gray-400 mr-2" />
                  New Password (leave blank to keep current)
                </span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`block w-full px-4 py-2.5 bg-gray-50 border ${
                  errors.password
                    ? "border-red-300 ring-red-300"
                    : "border-gray-300 focus:border-blue-500"
                } rounded-lg focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-colors duration-200`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                <span className="flex items-center">
                  <Lock className="h-4 w-4 text-gray-400 mr-2" />
                  Confirm New Password
                </span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`block w-full px-4 py-2.5 bg-gray-50 border ${
                  errors.confirmPassword
                    ? "border-red-300 ring-red-300"
                    : "border-gray-300 focus:border-blue-500"
                } rounded-lg focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-colors duration-200`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Role Field */}
            <div className="space-y-1">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                <span className="flex items-center">
                  <Shield className="h-4 w-4 text-gray-400 mr-2" />
                  Role
                </span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer"
              >
                <option value="admin">Admin</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="Nurse">Nurse</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* User Status Switch */}
            <div className="space-y-1">
              <label htmlFor="isInactive" className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <UserX className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Inactive Status</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="isInactive"
                    name="isInactive"
                    checked={formData.isInactive}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors duration-200 ease-in-out ${
                    formData.isInactive ? 'bg-red-500' : 'bg-gray-200'
                  }`}>
                    <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                      formData.isInactive ? 'transform translate-x-5' : ''
                    }`}></div>
                  </div>
                </div>
              </label>
              <p className="text-sm text-gray-500 mt-1 pl-6">
                {formData.isInactive ? "User account is inactive" : "User account is active"}
              </p>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate("/users")}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
