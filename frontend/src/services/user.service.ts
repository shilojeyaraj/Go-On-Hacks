import { api } from '../shared/api';

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  fullName?: string;
  profilePicture?: string;
  feetPhotos?: string[];
  bio?: string;
  archType?: string;
  archSize?: string;
  age?: number;
  ageCategory?: string;
  familyStatus?: string;
  preferredArchTypes?: string[];
  preferredArchSizes?: string[];
  footFeelPreferences?: string[];
  aestheticPreferences?: string[];
  toeActivityPreferences?: string[];
  footPersonalityPreferences?: string[];
  careRoutinePreferences?: string[];
  personalNote?: string;
  profileCompleted?: boolean;
  isPremium?: boolean;
  subscriptionId?: string;
  subscriptionStatus?: string;
  premiumExpiresAt?: string;
  swipeTracking?: {
    date: string;
    count: number;
  };
}

export interface SwipeLimit {
  canSwipe: boolean;
  remainingSwipes: number;
  isPremium: boolean;
}

export interface UpdateProfileData {
  fullName?: string;
  profilePicture?: string;
  feetPhotos?: string[];
  bio?: string;
}

export interface UpdatePreferencesData {
  archType?: string;
  archSize?: string;
  age?: number;
  ageCategory?: string;
  familyStatus?: string;
  preferredArchTypes?: string[];
  preferredArchSizes?: string[];
  footFeelPreferences?: string[];
  aestheticPreferences?: string[];
  toeActivityPreferences?: string[];
  footPersonalityPreferences?: string[];
  careRoutinePreferences?: string[];
  personalNote?: string;
}

export class UserService {
  static async getCurrentUser(): Promise<UserProfile> {
    const response = await api.get('/users/me');
    return response.data;
  }

  static async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await api.put('/users/me/profile', data);
    return response.data;
  }

  static async updatePreferences(data: UpdatePreferencesData): Promise<UserProfile> {
    const response = await api.put('/users/me/preferences', data);
    return response.data;
  }

  static async getMatches(): Promise<UserProfile[]> {
    const response = await api.get('/users/matches');
    return response.data;
  }

  static async getDiscoverProfiles(): Promise<UserProfile[]> {
    const response = await api.get('/users/discover');
    return response.data;
  }

  static async swipe(swipedId: string, action: 'like' | 'pass'): Promise<{ isMatch: boolean; message?: string }> {
    const response = await api.post('/users/swipe', {
      swipedId,
      action,
    });
    return response.data;
  }

  static async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static async getSwipeLimit(): Promise<SwipeLimit> {
    const response = await api.get('/users/swipe-limit');
    return response.data;
  }
}










