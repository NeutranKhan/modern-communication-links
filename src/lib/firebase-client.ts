'use client';
import {getApps,initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
export function browserAuth() { const config = {apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY,authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID}; if (!config.apiKey || !config.projectId) return null; return getAuth(getApps()[0] ?? initializeApp(config)); }