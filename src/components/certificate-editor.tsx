'use client';
import {useState} from 'react';
import {FileUpload} from './file-upload';
import {Participant} from '@/lib/schema';
export function CertificateEditor({participant:p,busy,onSave}:{participant:Participant;busy:boolean;onSave:(value:unknown)=>void}){
 const certificate=p.certificate;const [url,setUrl]=useState(certificate?.certificateUrl??'');const [uploading,setUploading]=useState(false);
 return <form className="form-card certificate-editor" onSubmit={e=>{
  e.preventDefault();if(uploading)return;const f=new FormData(e.currentTarget);
  onSave({reference:p.reference,completionDate:f.get('completionDate'),certificateUrl:f.get('certificateUrl'),publicVerificationConsent:f.get('publicVerificationConsent')==='on',completionConfirmed:f.get('completionConfirmed')==='on',status:f.get('status')});
 }}>
  <fieldset className="upload-fieldset" disabled={busy||uploading}><h3>{certificate?'Manage certificate':'Add completion certificate'}</h3>
  <p>Issue a certificate after the workshop ends and you confirm completion. Trainer names and signatures are copied from Website content when first issued.</p>
  {certificate&&<p className="reference">{certificate.code}</p>}
  <div className="two-grid"><label>Completion date<input type="date" name="completionDate" required max={new Date().toISOString().slice(0,10)} defaultValue={certificate?.completionDate??new Date().toISOString().slice(0,10)}/></label>
  <label>Certificate status<select name="status" defaultValue={certificate?.status??'valid'}><option value="valid">Issued / valid</option>{certificate&&<option value="revoked">Revoked</option>}</select></label></div>
  <input type="hidden" name="certificateUrl" value={url}/>
  <FileUpload certificate value={url} onUploaded={setUrl} onBusy={setUploading}/><p className="fine">Upload your designed certificate. Save the certificate to attach it to this participant. Public verification consent controls the lookup page; anyone with the uploaded file link can still open it.</p>
  <label className="checkbox-label"><input name="completionConfirmed" type="checkbox" required/>I confirm this participant completed the training.</label>
  <label className="checkbox-label"><input name="publicVerificationConsent" type="checkbox" defaultChecked={certificate?.publicVerificationConsent??false}/>The participant consents to public verification of their name, course and certificate.</label>
  <button className="button" disabled={busy}>{busy?'Saving…':certificate?'Save certificate':'Issue certificate'}</button>
 </fieldset></form>;
}
