import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../shared/firebase';

export class AuthService {
  static async signUp(email: string, password: string, displayName?: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
  }

  static async signIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  static async signInWithGoogle() {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return userCredential.user;
  }

  static async logout() {
    await signOut(auth);
  }

  static async sendPasswordReset(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  static getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

