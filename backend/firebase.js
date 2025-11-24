// secrets
require("dotenv").config({path: ".env"});
const API_KEY = process.env.FIREBASE_API_KEY;
const AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN;
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET;
const MESSAGE_SENDER_ID = process.env.FIREBASE_SENDER_ID;
const APP_ID = process.env.FIREBASE_APP_ID;
const MEASUREMENT_ID = process.env.FIREBASE_MEASUREMENT_ID;

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGE_SENDER_ID,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);