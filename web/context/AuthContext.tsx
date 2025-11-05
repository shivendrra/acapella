import React, { useState, useEffect, createContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, query, where, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AuthContextType, UserProfile, Role } from '../types';
import { v4 as uuidv4 } from 'uuid'; // Simple unique ID generator

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const generateUniqueUsername = async (displayName: string | null, email: string | null): Promise<string> => {
    const baseUsername = (displayName?.split(' ')[0] || email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
        const q = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            isUnique = true;
        } else {
            username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
            attempts++;
        }
    }
    // Fallback to a completely random username if we can't find a unique one
    if(!isUnique) {
        return `user-${uuidv4().split('-')[0]}`;
    }
    return username;
};


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
          const newUsername = await generateUniqueUsername(user.displayName, user.email);
          const newUserProfile: UserProfile = {
            uid: user.uid,
            username: newUsername,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.email === 'shivharsh44@gmail.com' ? Role.MASTER_ADMIN : Role.USER,
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newUserProfile);
          
          const usernamesRef = doc(db, 'usernames', newUsername);
          await setDoc(usernamesRef, { userId: user.uid });

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