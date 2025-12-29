import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';

export interface User {
  uid: string;
  fullName: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  providerId: string;
  package: 'platinum' | 'diamond';
  customTimeSelected: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  tier: "Gold" | "Diamond";
  collectionDate: string;
  collectionTime: string | null;
  isSystemTime: boolean;
  penaltyApplied: boolean;
  penaltyAmount: number;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  createdAt: any;
}

interface AuthContextType {
  currentUser: User | null;
  bookings: Booking | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  googleSignIn: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createBooking: (booking: Omit<Booking, 'userId' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateBooking: (booking: Partial<Booking>) => Promise<{ success: boolean; error?: string }>;
  deleteBooking: () => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            uid: firebaseUser.uid,
            fullName: userData.name || userData.fullName || '',
            name: userData.name || '',
            email: firebaseUser.email || '',
            phone: userData.phone || '',
            emailVerified: firebaseUser.emailVerified,
            providerId: firebaseUser.providerData[0]?.providerId || 'password',
            package: userData.package || 'platinum',
            customTimeSelected: userData.customTimeSelected || false
          });
        } else {
          setCurrentUser({
            uid: firebaseUser.uid,
            fullName: '',
            name: '',
            email: firebaseUser.email || '',
            phone: '',
            emailVerified: firebaseUser.emailVerified,
            providerId: firebaseUser.providerData[0]?.providerId || 'password',
            package: 'platinum',
            customTimeSelected: false
          });
        }

        const bookingDoc = await getDoc(doc(db, 'bookings', firebaseUser.uid));
        if (bookingDoc.exists()) {
          setBookings(bookingDoc.data() as Booking);
        } else {
          setBookings(null);
        }
      } else {
        setCurrentUser(null);
        setBookings(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        return { success: false, error: 'Please verify your email before signing in.' };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return { success: false, error: 'Invalid email or password.' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many failed attempts. Please try again later.' };
      } else {
        return { success: false, error: 'Login failed. Please try again.' };
      }
    }
  };

  const register = async (email: string, password: string, name: string, phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        phone,
        createdAt: serverTimestamp()
      }, { merge: true });

      await sendEmailVerification(userCredential.user);
      
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists.' };
      } else if (error.code === 'auth/weak-password') {
        return { success: false, error: 'Password should be at least 6 characters.' };
      } else {
        return { success: false, error: 'Registration failed. Please try again.' };
      }
    }
  };

  const googleSignIn = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      if (userCredential.user) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userCredential.user.displayName || '',
          email: userCredential.user.email || '',
          phone: '',
          createdAt: serverTimestamp()
        }, { merge: true });
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { success: false, error: 'Google sign-in failed. Please try again.' };
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  const createBooking = async (bookingData: Omit<Booking, 'userId' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      const booking: Booking = {
        ...bookingData,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'bookings', currentUser.uid), booking);
      setBookings(booking);
      
      return { success: true };
    } catch (error: any) {
      console.error('Create booking error:', error);
      return { success: false, error: 'Failed to create booking.' };
    }
  };

  const updateBooking = async (bookingData: Partial<Booking>): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      await updateDoc(doc(db, 'bookings', currentUser.uid), bookingData);
      
      if (bookings) {
        setBookings({ ...bookings, ...bookingData });
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Update booking error:', error);
      return { success: false, error: 'Failed to update booking.' };
    }
  };

  const deleteBooking = async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      await deleteDoc(doc(db, 'bookings', currentUser.uid));
      setBookings(null);
      
      return { success: true };
    } catch (error: any) {
      console.error('Delete booking error:', error);
      return { success: false, error: 'Failed to delete booking.' };
    }
  };

  const resendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) return { success: false, error: 'No user logged in' };

    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (error: any) {
      console.error('Resend verification error:', error);
      return { success: false, error: 'Failed to send verification email.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        bookings,
        isLoading,
        login,
        register,
        googleSignIn,
        logout,
        createBooking,
        updateBooking,
        deleteBooking,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
