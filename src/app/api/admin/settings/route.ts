import {NextRequest,NextResponse} from 'next/server';
import {adminServices} from '@/lib/firebase-admin';
import {siteSettingsSchema,defaultSettings} from '@/lib/site-settings';
import {requireAdmin,body,fail,privateHeaders} from '@/lib/server';
export async function GET(req:NextRequest){try{await requireAdmin(req);const snap=await adminServices().db.doc('settings/site').get();return NextResponse.json({...defaultSettings,...snap.data()},{headers:privateHeaders});}catch(e){return fail(e);}}
export async function POST(req:NextRequest){try{
 const uid=await requireAdmin(req);const settings=siteSettingsSchema.parse(await body(req));const {db}=adminServices();const batch=db.batch();
 batch.set(db.doc('settings/site'),settings);batch.create(db.collection('auditLogs').doc(),{action:'settings',uid,at:new Date().toISOString()});await batch.commit();
 return NextResponse.json({ok:true},{headers:privateHeaders});
}catch(e){return fail(e);}}
