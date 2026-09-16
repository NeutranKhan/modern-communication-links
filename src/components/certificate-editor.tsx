'use client';
import {Participant} from '@/lib/schema';
export function CertificateEditor({participant:p,busy,onSave}:{participant:Participant;busy:boolean;onSave:(value:unknown)=>void}){
 const certificate=p.certificate;
 return <form className="form-card certificate-editor" onSubmit={e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);
  onSave({reference:p.reference,completionDate:f.get('completionDate'),certificateUrl:f.get('certificateUrl'),publicVerificationConsent:f.get('publicVerificationConsent')==='on',completionConfirmed:f.get('completionConfirmed')==='on',status:f.get('status')});
 }}>
  <h3>{certificate?'Manage certificate':'Add completion certificate'}</h3>
  <p>Issue a certificate after the workshop ends and you confirm completion. Trainer names and signatures are copied from Website content when first issued.</p>
  {certificate&&<p className="reference">{certificate.code}</p>}
  <div className="two-grid"><label>Completion date<input type="date" name="completionDate" required max={new Date().toISOString().slice(0,10)} defaultValue={certificate?.completionDate??new Date().toISOString().slice(0,10)}/></label>
  <label>Certificate status<select name="status" defaultValue={certificate?.status??'valid'}><option value="valid">Issued / valid</option>{certificate&&<option value="revoked">Revoked</option>}</select></label></div>
  <label>Certificate PDF or image link (optional)<input type="url" name="certificateUrl" placeholder="https://…" defaultValue={certificate?.certificateUrl??''}/></label>
  <p className="fine">If you have a designed certificate, add its HTTPS file link. Otherwise, the issued record can be verified and printed from the verification page.</p>
  <label className="checkbox-label"><input name="completionConfirmed" type="checkbox" required/>I confirm this participant completed the training.</label>
  <label className="checkbox-label"><input name="publicVerificationConsent" type="checkbox" defaultChecked={certificate?.publicVerificationConsent??false}/>The participant consents to public verification of their name, course and certificate.</label>
  <button className="button" disabled={busy}>{busy?'Saving…':certificate?'Save certificate':'Issue certificate'}</button>
 </form>;
}
