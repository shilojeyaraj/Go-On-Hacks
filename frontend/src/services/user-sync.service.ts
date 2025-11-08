import { auth } from '../shared/firebase';
import { api } from '../shared/api';

/**
 * Syncs the current Firebase user to MongoDB
 * This should be called after successful login/signup
 */
export class UserSyncService {
  /**
   * Syncs the current authenticated user to MongoDB
   * This triggers the backend middleware to create/update the user record
   */
  static async syncUser(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently authenticated');
    }

    try {
      // Call the /users/me endpoint which triggers the sync middleware
      await api.get('/users/me');
    } catch (error: any) {
      // Log error but don't throw - sync failure shouldn't block the app
      console.error('Failed to sync user to MongoDB:', error.message);
    }
  }

  /**
   * Syncs user if authenticated
   * Safe to call multiple times - won't error if user is not logged in
   */
  static async syncUserIfAuthenticated(): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      await this.syncUser();
    }
  }
}

