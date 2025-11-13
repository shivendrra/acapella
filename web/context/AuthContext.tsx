import React, { useState, useEffect, createContext } from 'react';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { onAuthStateChanged, User as FirebaseUser } from '@firebase/auth';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { doc, getDoc, setDoc, serverTimestamp } from '@firebase/firestore';
import { auth, db } from '../services/firebase';
import { AuthContextType, UserProfile, Role } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // Create a very basic profile. User will complete it on the setup page.
          const tempUsername = `user-${user.uid.substring(0, 8)}`;
          const masterAdmins = ['shivharsh44@gmail.com', 'freakingaura@gmail.com'];
          const newUserProfile: UserProfile = {
            uid: user.uid,
            username: tempUsername,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: masterAdmins.includes(user.email || '') ? Role.MASTER_ADMIN : Role.USER,
            createdAt: serverTimestamp(),
            profileComplete: false, // Mark profile as incomplete
            followersCount: 0,
            followingCount: 0,
          };
          await setDoc(userRef, newUserProfile);
          setUserProfile(newUserProfile);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { currentUser, userProfile, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};