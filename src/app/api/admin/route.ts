import {revalidatePath} from 'next/cache';
import {contentPatch,removeGalleryPhoto} from '@/lib/content-sections';
import {randomBytes} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {adminServices} from '@/lib/firebase-admin';
import {certificateSchema,certificateProblem,defaultContent,capacityDelta,contentSchema,participantUpdateSchema,workshopSchema,Participant} from '@/lib/schema';
import {body,fail,HttpError,requireAdmin,privateHeaders} from '@/lib/server';
export async function GET(req:NextRequest){try{await requireAdmin(req); const {db}=adminServices(); let query=db.collection('registrations').orderBy('createdAt','desc').limit(101); const cursor=req.nextUrl.searchParams.get('cursor'); if(cursor){if(!/^MCL-[A-F0-9]{16}$/.test(cursor))throw new HttpError(400,'Invalid page cursor.');const last=await db.doc(`registrations/${cursor}`).get();if(!last.exists)throw new HttpError(400,'Page cursor expired. Please reload.');query=query.startAfter(last);}const [w,p,c]=await Promise.all([db.collection('workshops').get(),query.get(),db.doc('content/site').get()]);const page=p.docs.slice(0,100);return NextResponse.json({workshops:w.docs.map(d=>({...d.data(),id:d.id})),participants:page.map(d=>d.data()),nextCursor:p.docs.length>100?page[page.length-1].id:null,content:c.data()??null},{headers:privateHeaders});}catch(e){return fail(e);}}
export async function POST(req:NextRequest){try{const uid=await requireAdmin(req);const data=await body(req);const {db}=adminServices();
 if(data.action==='workshop'){const w=workshopSchema.parse(data.value);const ref=db.doc(`workshops/${w.id}`);await db.runTransaction(async tx=>{const old=await tx.get(ref);const reserved=old.data()?.reserved??0;if(w.capacity<reserved) throw new HttpError(409,'Capacity cannot be less than existing reservations.');tx.set(ref,{...w,reserved});tx.create(db.collection('auditLogs').doc(),{action:'workshop',target:w.id,uid,at:new Date().toISOString()});});}
 else if(data.action==='participant'){const update=participantUpdateSchema.parse(data.value); const ref=db.doc(`registrations/${update.reference}`);await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists) throw new HttpError(404,'Registration not found.');const old=snap.data() as Participant;const eventRef=db.doc(`workshops/${old.workshopId}`);const event=await tx.get(eventRef);if(!event.exists) throw new HttpError(409,'Workshop not found.');const w=event.data()!;if(update.attendance.some(day=>day>w.program.length)) throw new HttpError(400,'Attendance session does not exist in this workshop.');const delta=capacityDelta(old.paymentStatus,update.paymentStatus);if(w.reserved+delta>w.capacity) throw new HttpError(409,'No seats available to restore this registration.');tx.update(ref,{...update,attendance:[...new Set(update.attendance)],updatedAt:new Date().toISOString()});tx.update(eventRef,{reserved:Math.max(0,w.reserved+delta)});tx.create(db.collection('auditLogs').doc(),{action:'participant',target:update.reference,before:{paymentStatus:old.paymentStatus,attendance:old.attendance},after:update,uid,at:new Date().toISOString()});});}

 else if(data.action==='certificate'){
 const input=certificateSchema.parse(data.value);
 const participantRef=db.doc('registrations/'+input.reference);
 const newCode='MCL-CERT-'+randomBytes(12).toString('hex').toUpperCase();
 const certificateCode=await db.runTransaction(async tx=>{
  const snapshot=await tx.get(participantRef);
  if(!snapshot.exists)throw new HttpError(404,'Registration not found.');
  const participant=snapshot.data() as Participant;
  const [workshop,content]=await Promise.all([tx.get(db.doc('workshops/'+participant.workshopId)),tx.get(db.doc('content/site'))]);
  if(!workshop.exists)throw new HttpError(404,'Workshop not found.');
  const code=participant.certificate?.code??newCode;
  const certificateRef=db.doc('certificates/'+code);
  const existing=await tx.get(certificateRef);
  if(input.status==='revoked'&&!existing.exists)throw new HttpError(400,'Issue a certificate before revoking it.');
  if(input.status==='valid'){
   const problem=certificateProblem(participant,workshop.data()!.endAt,input.completionDate);
   if(problem)throw new HttpError(409,problem);
  }
  const summary={code,completionDate:input.completionDate,certificateUrl:input.certificateUrl,publicVerificationConsent:input.publicVerificationConsent,status:input.status};
  const trainers=existing.data()?.trainers??(content.data()??defaultContent).trainers.map((t:{name:string;signatureUrl:string})=>({name:t.name,signatureUrl:t.signatureUrl}));
  const at=new Date().toISOString();
  tx.set(certificateRef,{...summary,studentName:participant.fullName,course:participant.workshopTitle,workshopId:participant.workshopId,registrationReference:input.reference,trainers,issuedAt:existing.data()?.issuedAt??at,issuedBy:existing.data()?.issuedBy??uid,updatedAt:at,updatedBy:uid});
  tx.update(participantRef,{certificate:summary,updatedAt:at});
  tx.create(db.collection('auditLogs').doc(),{action:'certificate',target:code,uid,at,status:input.status});
  return code;
 });
 return NextResponse.json({ok:true,certificateCode},{headers:privateHeaders});
 }
 else if(data.action==='galleryRemove'){
 const ref=db.doc('content/site');
 const gallery=await db.runTransaction(async tx=>{
  const current=await tx.get(ref);
  const remaining=removeGalleryPhoto(current.data()?.gallery??[],data.value);
  if(!remaining)throw new HttpError(409,'The gallery changed since you opened it. Reload the admin page before removing this photo.');
  tx.set(ref,{gallery:remaining},{merge:true});
  tx.create(db.collection('auditLogs').doc(),{action:'galleryRemove',uid,at:new Date().toISOString()});
  return remaining;
 });
 revalidatePath('/gallery');
 return NextResponse.json({ok:true,gallery},{headers:privateHeaders});
 }
 else if(data.action==='contentSection'){const patch=contentPatch(data.value);const ref=db.doc('content/site');await db.runTransaction(async tx=>{const current=await tx.get(ref);tx.set(ref,current.exists?patch:{...defaultContent,...patch},{merge:true});tx.create(db.collection('auditLogs').doc(),{action:'contentSection',section:data.value.section,uid,at:new Date().toISOString()});});}
 else if(data.action==='content'){const content=contentSchema.parse(data.value);const batch=db.batch();batch.set(db.doc('content/site'),content);batch.create(db.collection('auditLogs').doc(),{action:'content',uid,at:new Date().toISOString()});await batch.commit();}
 else throw new HttpError(400,'Unknown action.');return NextResponse.json({ok:true},{headers:privateHeaders});}catch(e){return fail(e);}}