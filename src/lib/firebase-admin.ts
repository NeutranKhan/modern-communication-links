import 'server-only';
import {cert,getApps,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
export function configured() { return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.LOOKUP_HASH_SECRET && process.env.APP_URL); }
export function adminServices() {
 if (!configured()) throw new Error('SETUP_REQUIRED');
 const app = getApps()[0] ?? initializeApp({credential:cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g,'\n')})});
 return {db:getFirestore(app),auth:getAuth(app)};
}