'use client';
import {useState} from 'react';
import {browserAuth} from '@/lib/firebase-client';
export function FileUpload({certificate=false,value='',successMessage='File uploaded successfully. Save this form to publish the change.',onUploaded,onBusy}:{certificate?:boolean;value?:string;successMessage?:string;onUploaded:(url:string)=>void;onBusy:(busy:boolean)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[uploaded,setUploaded]=useState(''),[fileName,setFileName]=useState('');
 async function upload(file:File){
  setError('');setUploaded('');
  const allowed=certificate?['application/pdf','image/jpeg','image/png','image/webp']:['image/jpeg','image/png','image/webp'];
  if(!allowed.includes(file.type)){setError(certificate?'Choose a PDF, JPG, PNG, or WebP file.':'Choose a JPG, PNG, or WebP image.');return;}
  if(!file.size||file.size>4*1024*1024){setError('Choose a non-empty file up to 4 MB.');return;}
  setFileName(file.name);setBusy(true);onBusy(true);
  try{
   const user=browserAuth()?.currentUser;if(!user)throw new Error('Sign in again to upload files.');
   const response=await fetch('/api/admin/upload',{method:'POST',headers:{Authorization:'Bearer '+await user.getIdToken(),'Content-Type':file.type,'X-Upload-Kind':certificate?'certificate':'image'},body:file});
   const result=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(result?.error??'Upload failed. Please try a smaller file.');
   if(typeof result?.url!=='string'||!result.url.startsWith('https://'))throw new Error('The upload did not return a valid image link. Please try again.');
   onUploaded(result.url);setUploaded(result.url);
  }catch(e){setError(e instanceof Error?e.message:'Unable to upload. Please try again.');}
  finally{setBusy(false);onBusy(false);}
 }
 return <div className="upload-control" aria-busy={busy}>
 {value&&!certificate&&<img className="upload-preview" src={value} alt="Selected image preview"/>}
 {value&&certificate&&<p><a className="text-link" href={value} target="_blank" rel="noreferrer">Open attached certificate ↗</a></p>}
 <label>{value?(certificate?'Replace certificate file':'Replace image'):(certificate?'Upload certificate file':'Upload image')}<input type="file" accept={certificate?'application/pdf,image/jpeg,image/png,image/webp':'image/jpeg,image/png,image/webp'} disabled={busy} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void upload(file);}}/></label>
 <p className="fine">{certificate?'PDF, JPG, PNG, or WebP':'JPG, PNG, or WebP'} · Up to 4 MB. Files are accessible to anyone with their link.</p>
 {busy&&<div role="status"><progress aria-label="Uploading file"/><p>Uploading {fileName}… Please wait.</p></div>}
 {uploaded&&uploaded===value&&<p className="alert upload-success" role="status"><strong>✓ Upload successful</strong><br/>{successMessage}</p>}
 {error&&<p className="alert error" role="alert">{error}</p>}</div>;
}
