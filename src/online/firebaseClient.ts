import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAE5S7t3gV9P-Y5XNd9LtZ2oy1KNWm9qa4',
  authDomain: 'arcaderoom-3acd4.firebaseapp.com',
  databaseURL: 'https://arcaderoom-3acd4-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'arcaderoom-3acd4',
  appId: '1:192371634327:web:13549c002eb9bc7f28f9d2',
};

let app: FirebaseApp | null = null;
let signInPromise: Promise<string> | null = null;

function getApp(): FirebaseApp {
  if (app === null) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getOnlineDatabase(): Database {
  const database = getDatabase(getApp());
  return database;
}

async function signIn(): Promise<string> {
  const auth = getAuth(getApp());
  await auth.authStateReady();
  if (auth.currentUser !== null) {
    return auth.currentUser.uid;
  }
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

export function ensureSignedIn(): Promise<string> {
  if (signInPromise === null) {
    signInPromise = signIn().catch((error: unknown) => {
      signInPromise = null;
      throw error;
    });
  }
  return signInPromise;
}
