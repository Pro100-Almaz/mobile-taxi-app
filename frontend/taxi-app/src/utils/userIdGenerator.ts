/**
 * Utility functions for generating and managing unique user IDs
 */

const USER_ID_STORAGE_KEY = 'taxi_app_user_id'
const USER_ROLE_STORAGE_KEY = 'taxi_app_user_role'

export type UserRole = 'driver' | 'client'

/**
 * Generate a unique, readable user ID
 * Format: [ROLE]_[PREFIX]_[TIMESTAMP]_[RANDOM]
 * Example: driver_abc_1703123456789_4f2
 */
export function generateUserId(role: UserRole): string {
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).substring(2, 5) // 3-character random string
  const prefix = generateReadablePrefix(role)

  return `${role}_${prefix}_${timestamp}_${randomPart}`
}

/**
 * Generate a readable prefix based on role and some randomness
 */
function generateReadablePrefix(role: UserRole): string {
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

/**
 * Generate a display name from user ID
 * Example: "driver_red_1703123456789_4f2" -> "Red Driver"
 */
export function generateDisplayName(userId: string): string {
  if (!userId) return 'Unknown User'

  const parts = userId.split('_')
  if (parts.length < 2) return userId

  const role = parts[0]
  const prefix = parts[1]

  // Capitalize first letter of prefix
  const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1)

  // Capitalize role
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1)

  return `${capitalizedPrefix} ${capitalizedRole}`
}

/**
 * Store user ID and role in localStorage for persistence
 */
export function storeUserSession(userId: string, role: UserRole): void {
  try {
    localStorage.setItem(USER_ID_STORAGE_KEY, userId)
    localStorage.setItem(USER_ROLE_STORAGE_KEY, role)
  } catch (error) {
    console.warn('Failed to store user session in localStorage:', error)
  }
}

/**
 * Retrieve stored user ID and role from localStorage
 */
export function getStoredUserSession(): { userId: string | null; role: UserRole | null } {
  try {
    const userId = localStorage.getItem(USER_ID_STORAGE_KEY)
    const role = localStorage.getItem(USER_ROLE_STORAGE_KEY) as UserRole | null

    return { userId, role }
  } catch (error) {
    console.warn('Failed to retrieve user session from localStorage:', error)
    return { userId: null, role: null }
  }
}

/**
 * Clear stored user session
 */
export function clearUserSession(): void {
  try {
    localStorage.removeItem(USER_ID_STORAGE_KEY)
    localStorage.removeItem(USER_ROLE_STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear user session from localStorage:', error)
  }
}

/**
 * Validate user ID format
 */
export function isValidUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') return false

  // Check format: role_prefix_timestamp_random
  const parts = userId.split('_')
  if (parts.length !== 4) return false

  const [role, , timestamp, random] = parts

  // Validate role
  if (!['driver', 'client'].includes(role)) return false

  // Validate timestamp (should be a number)
  if (isNaN(Number(timestamp))) return false

  // Validate random part (should be alphanumeric)
  if (!/^[a-z0-9]+$/.test(random)) return false

  return true
}

/**
 * Get user info from ID
 */
export function parseUserId(userId: string): { role: UserRole; prefix: string; timestamp: number; random: string } | null {
  if (!isValidUserId(userId)) return null

  const [role, prefix, timestamp, random] = userId.split('_')

  return {
    role: role as UserRole,
    prefix,
    timestamp: Number(timestamp),
    random
  }
}
