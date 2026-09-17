import {NextRequest,NextResponse} from 'next/server';
import {adminServices} from '@/lib/firebase-admin';
import {feedbackSchema} from '@/lib/feedback';
import {body,fail,throttle,privateHeaders,requireAdmin,HttpError} from '@/lib/server';
export const runtime='nodejs';
export async function POST(req:NextRequest) {
 try {
  const input=feedbackSchema.parse(await body(req));
  // Vercel supplies this header; never store the raw address with feedback.
  const ip=req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';
  await throttle('feedback:'+ip,5);
  const {consent,website,...value}=input;void consent;void website;
  await adminServices().db.collection('feedback').add({...value,createdAt:new Date().toISOString()});
  return NextResponse.json({ok:true},{status:201,headers:privateHeaders});
 }catch(e){return fail(e);}
}
export async function GET(req:NextRequest) {
 try {
  await requireAdmin(req);
  const {db}=adminServices();
  let query=db.collection('feedback').orderBy('createdAt','desc').limit(51);
  const cursor=req.nextUrl.searchParams.get('cursor');
  if(cursor){if(!/^[a-zA-Z0-9]{20}$/.test(cursor))throw new HttpError(400,'Invalid cursor.');const last=await db.doc('feedback/'+cursor).get();if(!last.exists)throw new HttpError(400,'Reload feedback.');query=query.startAfter(last);}
  const result=await query.get();const docs=result.docs.slice(0,50);
  return NextResponse.json({feedback:docs.map(d=>({...d.data(),id:d.id})),nextCursor:result.docs.length>50?docs[docs.length-1].id:null},{headers:privateHeaders});
 }catch(e){return fail(e);}
}
