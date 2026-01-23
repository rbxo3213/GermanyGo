import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAeYRo2fsZuYmMbJNNGbC1nedy3AInUjY0",
  authDomain: "germanygo-393f3.firebaseapp.com",
  projectId: "germanygo-393f3",
  storageBucket: "germanygo-393f3.firebasestorage.app",
  messagingSenderId: "973311005127",
  appId: "1:973311005127:web:436055a167a6f48021c9e2",
  measurementId: "G-HYJQ5MDR3B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.log("Persistence failed: multiple tabs open");
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.log("Persistence failed: browser not supported");
    }
  });
}

