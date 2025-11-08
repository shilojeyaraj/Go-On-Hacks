import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../shared/firebase';
import { UserSyncService } from '../services/user-sync.service';

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Automatically sync user to MongoDB when auth state changes
      if (user) {
        // Small delay to ensure token is ready
        setTimeout(() => {
          UserSyncService.syncUserIfAuthenticated();
        }, 500);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}

