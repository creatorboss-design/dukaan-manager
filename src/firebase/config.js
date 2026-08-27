import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBgn333oIHOkn01YA0OMmsXgMo_OrHWhgs",
  authDomain: "dukaan-manager-6c75b.firebaseapp.com",
  projectId: "dukaan-manager-6c75b",
  storageBucket: "dukaan-manager-6c75b.firebasestorage.app",
  messagingSenderId: "828813547366",
  appId: "1:828813547366:web:ea6888cc5a505733425aa7",
  measurementId: "G-BQ94SFEMV8"
};

const app = initializeApp(firebaseConfig);

// Use the modern persistent cache API (replaces deprecated enableIndexedDbPersistence)
// persistentMultipleTabManager allows the app to work in multiple tabs simultaneously
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
