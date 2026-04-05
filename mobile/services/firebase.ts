import 'react-native-get-random-values';

import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
} from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCareo74cQexHW7_c_eCvYYXyV8F1J8BH4",
  authDomain: "allepacaeht.firebaseapp.com",
  projectId: "allepacaeht",
  storageBucket: "allepacaeht.firebasestorage.app",
  messagingSenderId: "606962330423",
  appId: "1:606962330423:web:c7e49138e761db47fec8b2",
  measurementId: "G-KTVT87FGLR"
};

const app = initializeApp(firebaseConfig);

export const auth = (() => {
  try {
    if (Platform.OS === 'web') {
      return initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    }

    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;