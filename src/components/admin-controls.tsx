'use client';
import {useState} from 'react';
import type {Participant} from '@/lib/schema';
import {csvRows} from '@/lib/csv';
export function DeleteButton({label,description,busy,onDelete}:{label:string;description:string;busy:boolean;onDelete:()=>void}){
 const [confirm,setConfirm]=useState(false),[text,setText]=useState('');
 if(!confirm)return <button type="button" className="button secondary small danger" disabled={busy} onClick={()=>setConfirm(true)}>{label}</button>;
 return <div className="delete-confirm"><p>{description}</p><label>Type DELETE to confirm<input value={text} autoComplete="off" onChange={e=>setText(e.target.value)}/></label><div className="button-row"><button type="button" className="button danger" disabled={busy||text!=='DELETE'} onClick={onDelete}>{busy?'Deleting…':'Permanently delete'}</button><button type="button" className="button secondary small" disabled={busy} onClick={()=>{setConfirm(false);setText('');}}>Keep it</button></div></div>;
}
export function ParticipantDetails({participant:p,busy,onSave}:{participant:Participant;busy:boolean;onSave:(value:unknown)=>void}){
 return <form className="form-card" onSubmit={e=>{e.preventDefault();onSave({action:'participantDetails',reference:p.reference,details:Object.fromEntries(new FormData(e.currentTarget))});}}><h3>Edit participant details</h3><div className="two-grid">{(['fullName','phone','email','occupation','city'] as const).map(key=><label key={key}>{{fullName:'Full name',phone:'Phone / WhatsApp',email:'Email',occupation:'Occupation',city:'City / community'}[key]}<input name={key} type={key==='email'?'email':key==='phone'?'tel':'text'} required maxLength={key==='email'?160:key==='phone'?20:100} defaultValue={p[key]}/></label>)}<label>Gender (optional)<select name="gender" defaultValue={p.gender||''}><option value="">Not specified</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label></div><p className="fine">A changed phone number becomes the number used for registration lookup. Name corrections also update an issued certificate.</p><button className="button" disabled={busy}>{busy?'Saving…':'Save details'}</button></form>;
}
export function ExportParticipants({participants}:{participants:Participant[]}){
 function download(){
 const rows=[['Name','Reference','Workshop','Phone','Email','Occupation','City','Payment','Amount USD','Attendance'],...participants.map(p=>[p.fullName,p.reference,p.workshopTitle,p.phone,p.email,p.occupation,p.city,p.paymentStatus,p.price,p.attendance.join('; ')])];
 const url=URL.createObjectURL(new Blob([csvRows(rows)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='participants-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <button className="button secondary small" disabled={!participants.length} onClick={download}>Export {participants.length} displayed participants (CSV)</button>;
}
