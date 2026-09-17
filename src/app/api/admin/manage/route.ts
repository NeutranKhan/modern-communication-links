import {NextRequest,NextResponse} from 'next/server';
import {adminServices} from '@/lib/firebase-admin';
import {manage} from '@/lib/admin-management';
import {requireAdmin,body,hash,fail,privateHeaders} from '@/lib/server';
export async function POST(req:NextRequest){try{
 const uid=await requireAdmin(req);await manage(adminServices().db,uid,await body(req),hash);
 return NextResponse.json({ok:true},{headers:privateHeaders});
}catch(e){return fail(e);}}
