'use client';
import {useState} from 'react';
import {browserAuth} from '@/lib/firebase-client';
export function FileUpload({certificate=false,onUploaded,onBusy}:{certificate?:boolean;onUploaded:(url:string)=>void;onBusy:(busy:boolean)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function upload(file:File){
  setError('');setNotice('');
  const allowed=certificate?['application/pdf','image/jpeg','image/png','image/webp']:['image/jpeg','image/png','image/webp'];
  if(!allowed.includes(file.type)){setError(certificate?'Choose a PDF, JPG, PNG, or WebP file.':'Choose a JPG, PNG, or WebP image.');return;}
  if(!file.size||file.size>4*1024*1024){setError('Choose a non-empty file up to 4 MB.');return;}
  setBusy(true);onBusy(true);
  try{
   const user=browserAuth()?.currentUser;if(!user)throw new Error('Sign in again to upload files.');
   const response=await fetch('/api/admin/upload',{method:'POST',headers:{Authorization:'Bearer '+await user.getIdToken(),'Content-Type':file.type,'X-Upload-Kind':certificate?'certificate':'image'},body:file});
   if(!response.ok){const result=await response.json().catch(()=>null);throw new Error(result?.error??'Upload failed. Please try a smaller file.');}
   const result=await response.json();onUploaded(result.url);setNotice('Uploaded. Save the form below to publish this change.');
  }catch(e){setError(e instanceof Error?e.message:'Unable to upload. Please try again.');}
  finally{setBusy(false);onBusy(false);}
 }
 return <div className="upload-control"><label>{certificate?'Upload certificate file':'Upload image'}<input type="file" accept={certificate?'application/pdf,image/jpeg,image/png,image/webp':'image/jpeg,image/png,image/webp'} disabled={busy} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void upload(file);}}/></label><p className="fine">{certificate?'PDF, JPG, PNG, or WebP':'JPG, PNG, or WebP'} · Up to 4 MB. Files are accessible to anyone with their link.</p>{busy&&<p role="status">Uploading…</p>}{notice&&<p role="status">{notice}</p>}{error&&<p className="alert error" role="alert">{error}</p>}</div>;
}
