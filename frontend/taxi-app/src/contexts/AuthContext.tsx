import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// Define the UserRole type locally to avoid import conflicts
type UserRoleGenerator = 'driver' | 'client'

export type UserRole = 'driver' | 'client' | null

// Local implementations of the userIdGenerator functions to avoid import issues
const generateReadablePrefix = (role: UserRoleGenerator): string => {
  const driverPrefixes = [
    'red', 'blue', 'green', 'yellow', 'black', 'white', 'silver', 'gold',
    'fast', 'quick', 'speed', 'rapid', 'swift', 'zoom', 'rush', 'fleet'
  ]

  const clientPrefixes = [
    'sunny', 'bright', 'clear', 'happy', 'lucky', 'smart', 'wise', 'cool',
    'calm', 'peace', 'quiet', 'gentle', 'kind', 'nice', 'sweet', 'warm'
  ]

  const prefixes = role === 'driver' ? driverPrefixes : clientPrefixes
  const randomIndex = Math.floor(Math.random() * prefixes.length)

  return prefixes[randomIndex]
}

const generateUserId = (role: UserRoleGenerator): string => {
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).substring(2, 5)
  const prefix = generateReadablePrefix(role)

  return `${role}_${prefix}_${timestamp}_${randomPart}`
}

const generateDisplayName = (userId: string): string => {
  if (!userId) return 'Unknown User'

  const parts = userId.split('_')
  if (parts.length < 2) return userId

  const role = parts[0]
  const prefix = parts[1]

  const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1)
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1)

  return `${capitalizedPrefix} ${capitalizedRole}`
}

const USER_ID_STORAGE_KEY = 'taxi_app_user_id'
const USER_ROLE_STORAGE_KEY = 'taxi_app_user_role'

const storeUserSession = (userId: string, role: UserRoleGenerator): void => {
  try {
    localStorage.setItem(USER_ID_STORAGE_KEY, userId)
    localStorage.setItem(USER_ROLE_STORAGE_KEY, role)
  } catch (error) {
    console.warn('Failed to store user session in localStorage:', error)
  }
}

const getStoredUserSession = (): { userId: string | null; role: UserRoleGenerator | null } => {
  try {
    const userId = localStorage.getItem(USER_ID_STORAGE_KEY)
    const role = localStorage.getItem(USER_ROLE_STORAGE_KEY) as UserRoleGenerator | null

    return { userId, role }
  } catch (error) {
    console.warn('Failed to retrieve user session from localStorage:', error)
    return { userId: null, role: null }
  }
}

const clearUserSession = (): void => {
  try {
    localStorage.removeItem(USER_ID_STORAGE_KEY)
    localStorage.removeItem(USER_ROLE_STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear user session from localStorage:', error)
  }
}

interface AuthContextType {
  userRole: UserRole
  setUserRole: (role: UserRole) => void
  userId: string | null
  setUserId: (id: string | null) => void
  displayName: string
  isAuthenticated: boolean
  login: (role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<UserRole>(null)
  const [userId, setUserIdState] = useState<string | null>(null)

  // Load stored session on mount
  useEffect(() => {
    const stored = getStoredUserSession()
    if (stored.userId && stored.role) {
      setUserRoleState(stored.role)
      setUserIdState(stored.userId)
    }
  }, [])

  // Generate display name from user ID
  const displayName = userId ? generateDisplayName(userId) : 'Guest'

  // Check if user is authenticated
  const isAuthenticated = userRole !== null && userId !== null

  // Enhanced setUserRole that handles user ID generation
  const setUserRole = (role: UserRole) => {
    if (role) {
      // Generate new user ID when setting role
      const newUserId = generateUserId(role as UserRoleGenerator)
      setUserRoleState(role)
      setUserIdState(newUserId)
      storeUserSession(newUserId, role as UserRoleGenerator)
    } else {
      setUserRoleState(null)
      setUserIdState(null)
      clearUserSession()
    }
  }

  // Direct user ID setter (for manual override)
  const setUserId = (id: string | null) => {
    setUserIdState(id)
    if (id && userRole) {
      storeUserSession(id, userRole as UserRoleGenerator)
    } else if (!id) {
      clearUserSession()
    }
  }

  // Login method for programmatic login
  const login = (role: UserRole) => {
    if (role) {
      const newUserId = generateUserId(role as UserRoleGenerator)
      setUserRoleState(role)
      setUserIdState(newUserId)
      storeUserSession(newUserId, role as UserRoleGenerator)
    }
  }

  // Logout method
  const logout = () => {
    setUserRoleState(null)
    setUserIdState(null)
    clearUserSession()
  }

  const value: AuthContextType = {
    userRole,
    setUserRole,
    userId,
    setUserId,
    displayName,
    isAuthenticated,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
