import 'server-only';
import {cache} from 'react';
import {adminServices,configured} from './firebase-admin';
import {defaultSettings,siteSettingsSchema} from './site-settings';
export const getSiteSettings=cache(async()=>{
 if(!configured())return defaultSettings;
 try{const snap=await adminServices().db.doc('settings/site').get();return siteSettingsSchema.parse({...defaultSettings,...snap.data()});}
 catch{console.error('Website settings unavailable');return defaultSettings;}
});
