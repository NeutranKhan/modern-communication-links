import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
const uid=process.argv[2];
if(!uid)throw new Error('Usage: node --env-file=.env.local scripts/set-admin.mjs FIREBASE_UID');
initializeApp({credential:cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,'\n')})});
const auth=getAuth();
const user=await auth.getUser(uid);
await auth.setCustomUserClaims(uid,{...user.customClaims,admin:true});
console.log('Administrator claim granted. Sign out and back in to refresh access.');