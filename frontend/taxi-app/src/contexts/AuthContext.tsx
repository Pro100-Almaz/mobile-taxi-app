import React, { createContext, useContext, useState, ReactNode } from 'react'

export type UserRole = 'driver' | 'client' | null

interface AuthContextType {
  userRole: UserRole
  setUserRole: (role: UserRole) => void
  userId: string | null
  setUserId: (id: string | null) => void
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
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [userId, setUserId] = useState<string | null>(null)

  return (
    <AuthContext.Provider value={{ userRole, setUserRole, userId, setUserId }}>
      {children}
    </AuthContext.Provider>
  )
}
