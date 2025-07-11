/**
 * Gets the user's initials from the auth_user data in localStorage
 * @returns {string} The user's initials (e.g., "JD" for John Doe)
 */
export const getUserInitialsFromAuthUser = (): string => {
  try {
    const authUserStr = localStorage.getItem('auth_user');
    console.log('Raw auth_user from localStorage:', authUserStr);
    
    if (!authUserStr) {
      console.log('No auth_user found in localStorage');
      return '';
    }
    
    const authUser = JSON.parse(authUserStr);
    console.log('Parsed auth_user:', authUser);
    
    const firstname = authUser.first_name || '';
    const lastname = authUser.last_name || '';
    console.log('First name:', firstname, 'Last name:', lastname);
    
    const firstInitial = firstname.charAt(0).toUpperCase();
    const lastInitial = lastname.charAt(0).toUpperCase();
    console.log('Calculated initials:', `${firstInitial}${lastInitial}`);
    
    return `${firstInitial}${lastInitial}`;
  } catch (error) {
    console.error('Error getting user initials:', error);
    return '';
  }
};

// Utility to get user's initials from a user object
export interface User {
  first_name?: string;
  last_name?: string;
}

export function getUserInitials(user: User | null | undefined): string {
  if (!user) return '';
  const { first_name, last_name } = user;
  return `${first_name?.[0] || ''}${last_name?.[0] || ''}`.toUpperCase();
} 