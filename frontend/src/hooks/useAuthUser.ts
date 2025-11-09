import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import { auth } from '../shared/firebase';
import { UserSyncService } from '../services/user-sync.service';

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Automatically sync user to MongoDB when auth state changes
      // But only sync once per session and debounce to prevent excessive requests
      if (user && !hasSyncedRef.current) {
        // Clear any pending sync
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        
        // Debounce sync to prevent multiple rapid calls
        syncTimeoutRef.current = setTimeout(() => {
          UserSyncService.syncUserIfAuthenticated().then(() => {
            hasSyncedRef.current = true;
          });
        }, 1000);
      } else if (!user) {
        // Reset sync flag when user logs out
        hasSyncedRef.current = false;
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
      }
    });

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return { user, loading };
}

