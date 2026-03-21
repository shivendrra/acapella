import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCareo74cQexHW7_c_eCvYYXyV8F1J8BH4",
  authDomain: "allepacaeht.firebaseapp.com",
  projectId: "allepacaeht",
  storageBucket: "allepacaeht.appspot.com",
  messagingSenderId: "606962330423",
  appId: "1:606962330423:web:c7e49138e761db47fec8b2",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);