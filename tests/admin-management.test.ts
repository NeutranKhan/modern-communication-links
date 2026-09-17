import test from 'node:test';
import assert from 'node:assert/strict';
import type {Firestore} from 'firebase-admin/firestore';
import {manage,managementSchema} from '../src/lib/admin-management';
import {siteSettingsSchema,defaultSettings} from '../src/lib/site-settings';
import {csvRows} from '../src/lib/csv';

// In-memory transaction adapter: writes commit only after the callback succeeds.
// It rejects reads after writes, like Firestore, and never accesses live data.
function database(seed:Record<string,Record<string,unknown>>){
 const rows=new Map(Object.entries(structuredClone(seed)));let n=0;
 const ref=(path:string)=>({path});
 const snapshot=(path:string)=>({exists:rows.has(path),data:()=>structuredClone(rows.get(path))});
 const db={
  doc:ref,
  collection:(path:string)=>({doc:()=>ref(path+'/audit'+(++n)),where:(field:string,_op:string,value:unknown)=>({query:true,path,field,value,limit:(limit:number)=>({query:true,path,field,value,limit})})}),
  runTransaction:async(fn:(tx:unknown)=>Promise<void>)=>{
   const writes:Array<()=>void>=[];let wrote=false;
   await fn({
    get:async(r:{query?:boolean;path:string;field:string;value:unknown;limit:number})=>{
     assert.equal(wrote,false,'Firestore reads must precede writes');
     if(r.query){const docs=[...rows].filter(([p,v])=>p.startsWith(r.path+'/')&&v[r.field]===r.value).slice(0,r.limit).map(([p])=>snapshot(p));return {docs,empty:docs.length===0};}
     return snapshot(r.path);
    },
    create:(r:{path:string},v:Record<string,unknown>)=>{wrote=true;writes.push(()=>rows.set(r.path,structuredClone(v)));},
    set:(r:{path:string},v:Record<string,unknown>)=>{wrote=true;writes.push(()=>rows.set(r.path,structuredClone(v)));},
    update:(r:{path:string},v:Record<string,unknown>)=>{wrote=true;writes.push(()=>rows.set(r.path,{...rows.get(r.path),...structuredClone(v)}));},
    delete:(r:{path:string})=>{wrote=true;writes.push(()=>rows.delete(r.path));}
   });
   writes.forEach(w=>w());
  }
 } as unknown as Firestore;
 return {db,rows};
}
const reference='MCL-0123456789ABCDEF';
const phone='+231770726497';
const code='MCL-CERT-0123456789ABCDEF01234567';
const hash=(s:string)=>Buffer.from(s).toString('hex');
function fixture(status='paid'){
 return database({
  ['registrations/'+reference]:{reference,workshopId:'workshop',phone,fullName:'Original Name',paymentStatus:status,certificate:{code}},
  'workshops/workshop':{reserved:3,published:true},
  ['registrationKeys/'+hash('workshop:'+phone)]:{reference},
  ['certificates/'+code]:{studentName:'Original Name'}
 });
}
test('participant deletion releases one seat and removes lookup and certificate atomically',async()=>{
 const {db,rows}=fixture();
 const command={action:'deleteParticipant',reference,confirmation:'DELETE'};
 await manage(db,'admin',command,hash);
 assert.equal(rows.get('workshops/workshop')!.reserved,2);
 assert.ok(!rows.has('registrations/'+reference));
 assert.ok(!rows.has('registrationKeys/'+hash('workshop:'+phone)));
 assert.ok(!rows.has('certificates/'+code));
 assert.equal([...rows.keys()].filter(k=>k.startsWith('auditLogs/')).length,1);
 await assert.rejects(manage(db,'admin',command,hash),/not found/);
 assert.equal(rows.get('workshops/workshop')!.reserved,2);
});
test('deleting a cancelled participant does not release another seat',async()=>{
 const {db,rows}=fixture('cancelled');await manage(db,'admin',{action:'deleteParticipant',reference,confirmation:'DELETE'},hash);
 assert.equal(rows.get('workshops/workshop')!.reserved,3);
});
test('workshop deletion checks registrations even when reserved is zero',async()=>{
 const {db,rows}=fixture();rows.get('workshops/workshop')!.reserved=0;
 await assert.rejects(manage(db,'admin',{action:'deleteWorkshop',id:'workshop',confirmation:'DELETE'},hash),/has registrations/);
 assert.ok(rows.has('workshops/workshop'));
 await manage(db,'admin',{action:'publishWorkshop',id:'workshop',published:false},hash);
 assert.equal(rows.get('workshops/workshop')!.published,false);
});
test('empty workshops can be permanently deleted',async()=>{
 const {db,rows}=database({'workshops/empty':{reserved:0}});
 await manage(db,'admin',{action:'deleteWorkshop',id:'empty',confirmation:'DELETE'},hash);assert.ok(!rows.has('workshops/empty'));
});
const details={fullName:'Corrected Name',phone:'0775972161',email:'visitor@example.com',occupation:'Student',city:'Monrovia',gender:''};
test('participant corrections migrate lookup keys and update certificate name',async()=>{
 const {db,rows}=fixture();
 await manage(db,'admin',{action:'participantDetails',reference,details},hash);
 assert.equal(rows.get('registrations/'+reference)!.phone,'+231775972161');
 assert.equal(rows.get('certificates/'+code)!.studentName,'Corrected Name');
 assert.ok(!rows.has('registrationKeys/'+hash('workshop:'+phone)));
 assert.equal(rows.get('registrationKeys/'+hash('workshop:+231775972161'))!.reference,reference);
 assert.equal(rows.get('workshops/workshop')!.reserved,3);
});
test('duplicate phones reject edits without partial changes',async()=>{
 const {db,rows}=fixture();rows.set('registrationKeys/'+hash('workshop:+231775972161'),{reference:'someone-else'});
 await assert.rejects(manage(db,'admin',{action:'participantDetails',reference,details},hash),/already registered/);
 assert.equal(rows.get('registrations/'+reference)!.fullName,'Original Name');
 assert.ok(rows.has('registrationKeys/'+hash('workshop:'+phone)));
});
test('feedback can be reviewed and deleted with an audit trail',async()=>{
 const id='abcdefghijklmnopqrst';const {db,rows}=database({['feedback/'+id]:{name:'Visitor',message:'Private message'}});
 await manage(db,'admin',{action:'reviewFeedback',id,reviewed:true},hash);assert.equal(rows.get('feedback/'+id)!.reviewed,true);
 await manage(db,'admin',{action:'deleteFeedback',id,confirmation:'DELETE'},hash);assert.ok(!rows.has('feedback/'+id));
 assert.equal([...rows.keys()].filter(k=>k.startsWith('auditLogs/')).length,2);
 assert.ok(!JSON.stringify([...rows.values()]).includes('Private message'));
});
test('management schema requires explicit deletion confirmation and safe identifiers',()=>{
 for(const value of [{action:'deleteParticipant',reference},{action:'deleteWorkshop',id:'../other',confirmation:'DELETE'},{action:'deleteFeedback',id:'bad',confirmation:'DELETE'}])assert.equal(managementSchema.safeParse(value).success,false);
});
test('site settings validate contact links and prices',()=>{
 assert.ok(siteSettingsSchema.safeParse(defaultSettings).success);
 for(const invalid of [{facebook:'javascript:alert(1)'},{phone1:'123'},{defaultPrice:-1},{defaultPrice:3.456},{email:'bad'}])assert.equal(siteSettingsSchema.safeParse({...defaultSettings,...invalid}).success,false);
});
test('CSV quotes cells and neutralizes spreadsheet formulas',()=>{
 const result=csvRows([['=HYPERLINK("evil")',' +123','line\nbreak','a,b']]);
 assert.ok(result.includes('"\'=HYPERLINK(""evil"")"'));assert.ok(result.includes('"\' +123"'));assert.ok(result.includes('"a,b"'));
});
