import type {Firestore} from 'firebase-admin/firestore';
import {z} from 'zod';
import {lookupSchema,registrationSchema,Participant} from './schema';
import {HttpError} from './http-error';
export const managementSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('deleteWorkshop'),id:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),confirmation:z.literal('DELETE')}),
 z.object({action:z.literal('publishWorkshop'),id:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),published:z.boolean()}),
 z.object({action:z.literal('deleteParticipant'),reference:lookupSchema.shape.reference,confirmation:z.literal('DELETE')}),
 z.object({action:z.literal('participantDetails'),reference:lookupSchema.shape.reference,details:registrationSchema.pick({fullName:true,phone:true,email:true,occupation:true,city:true,gender:true})}),
 z.object({action:z.literal('deleteFeedback'),id:z.string().regex(/^[a-zA-Z0-9]{20}$/),confirmation:z.literal('DELETE')}),
 z.object({action:z.literal('reviewFeedback'),id:z.string().regex(/^[a-zA-Z0-9]{20}$/),reviewed:z.boolean()})
]);
export async function manage(db:Firestore,uid:string,raw:unknown,hash:(s:string)=>string){
 const input=managementSchema.parse(raw);
 await db.runTransaction(async tx=>{
  const at=new Date().toISOString();
  const audit=(target:string)=>tx.create(db.collection('auditLogs').doc(),{action:input.action,target,uid,at});
  if(input.action==='deleteWorkshop'||input.action==='publishWorkshop'){
   const ref=db.doc('workshops/'+input.id),snap=await tx.get(ref);
   if(!snap.exists)throw new HttpError(404,'Workshop not found.');
   if(input.action==='deleteWorkshop'){
    const registrations=await tx.get(db.collection('registrations').where('workshopId','==',input.id).limit(1));
    if(!registrations.empty||snap.data()!.reserved>0)throw new HttpError(409,'This workshop has registrations. Unpublish it to hide it, or remove all participants before deleting it.');
    tx.delete(ref);
   }else tx.update(ref,{published:input.published});
   audit(input.id);return;
  }
  if(input.action==='deleteFeedback'||input.action==='reviewFeedback'){
   const ref=db.doc('feedback/'+input.id),snap=await tx.get(ref);
   if(!snap.exists)throw new HttpError(404,'Feedback not found. Refresh the inbox.');
   if(input.action==='deleteFeedback')tx.delete(ref);
   else tx.update(ref,{reviewed:input.reviewed,reviewedBy:uid,reviewedAt:at});
   audit(input.id);return;
  }
  const ref=db.doc('registrations/'+input.reference),snap=await tx.get(ref);
  if(!snap.exists)throw new HttpError(404,'Participant not found. Refresh the list.');
  const p=snap.data() as Participant;
  const keyRef=db.doc('registrationKeys/'+hash(p.workshopId+':'+p.phone));
  const key=await tx.get(keyRef);
  const certRef=p.certificate?db.doc('certificates/'+p.certificate.code):null;
  const cert=certRef?await tx.get(certRef):null;
  if(input.action==='deleteParticipant'){
   const eventRef=db.doc('workshops/'+p.workshopId),event=await tx.get(eventRef);
   if(event.exists&&p.paymentStatus!=='cancelled')tx.update(eventRef,{reserved:Math.max(0,(event.data()!.reserved??0)-1)});
   if(key.exists&&key.data()!.reference===p.reference)tx.delete(keyRef);
   if(certRef&&cert?.exists)tx.delete(certRef);
   tx.delete(ref);
  }else{
   const newKeyRef=db.doc('registrationKeys/'+hash(p.workshopId+':'+input.details.phone));
   const nextKey=await tx.get(newKeyRef);
   if(nextKey.exists&&nextKey.data()!.reference!==p.reference)throw new HttpError(409,'That phone number is already registered for this workshop.');
   if(newKeyRef.path!==keyRef.path&&key.exists&&key.data()!.reference===p.reference)tx.delete(keyRef);
   tx.set(newKeyRef,{reference:p.reference});
   tx.update(ref,{...input.details,updatedAt:at});
   if(certRef&&cert?.exists)tx.update(certRef,{studentName:input.details.fullName,updatedAt:at,updatedBy:uid});
  }
  audit(p.reference);
 });
}
