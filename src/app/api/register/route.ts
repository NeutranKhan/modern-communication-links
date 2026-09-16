import {randomBytes} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {adminServices} from '@/lib/firebase-admin';
import {registrationSchema,registrationProblem,Workshop} from '@/lib/schema';
import {body,fail,hash,HttpError,throttle,privateHeaders} from '@/lib/server';
export const runtime='nodejs';
export async function POST(req:NextRequest) { try {
 const input=registrationSchema.parse(await body(req)); const {db}=adminServices(); await throttle('register:'+input.phone,5);
 const reference='MCL-'+randomBytes(8).toString('hex').toUpperCase(); const eventRef=db.doc(`workshops/${input.workshopId}`); const duplicateRef=db.doc(`registrationKeys/${hash(input.workshopId+':'+input.phone)}`);
 const result=await db.runTransaction(async tx=> { const [event,duplicate]=await Promise.all([tx.get(eventRef),tx.get(duplicateRef)]); if(duplicate.exists) throw new HttpError(409,'This phone number is already registered for this workshop. Use your reference to check status, or contact our office.'); if(!event.exists) throw new HttpError(404,'Workshop not found.'); const w=event.data() as Workshop; const problem=registrationProblem(w); if(problem) throw new HttpError(409,problem);
 const {consent,website,...contact}=input; void consent; void website;
 tx.create(db.doc(`registrations/${reference}`),{...contact,reference,workshopTitle:w.title,price:w.price,paymentStatus:'pending',attendance:[],createdAt:new Date().toISOString(),consentAt:new Date().toISOString()});
 tx.create(duplicateRef,{reference}); tx.update(eventRef,{reserved:w.reserved+1}); return {reference,paymentStatus:'pending',price:w.price,paymentDeadline:w.paymentDeadline,paymentLocation:w.paymentLocation}; });
 return NextResponse.json(result,{status:201,headers:privateHeaders});
 } catch(e) {return fail(e);} }