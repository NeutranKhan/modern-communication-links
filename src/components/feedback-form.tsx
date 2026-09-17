'use client';
import {useState} from 'react';
export function FeedbackForm(){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError('');
  const f=new FormData(e.currentTarget);
  try {const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:f.get('name'),email:f.get('email'),rating:Number(f.get('rating')),message:f.get('message'),website:f.get('website'),consent:f.get('consent')==='on'})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to send feedback.');setSent(true);}
  catch(e){setError(e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}
 }
 if(sent)return <div className="confirmation" role="status"><h2>Thank you for your feedback.</h2><p>Your message has been sent privately to our team.</p><button className="button secondary" onClick={()=>setSent(false)}>Write another message</button></div>;
 return <form className="form-card lookup-shell" onSubmit={submit}><h2>Your experience matters.</h2><label>Your name<input name="name" autoComplete="name" minLength={2} maxLength={100} required/></label><label>Email (optional, if you’d like a reply)<input name="email" type="email" autoComplete="email" maxLength={160}/></label><label>How was your experience?<select name="rating" required defaultValue=""><option value="" disabled>Select a rating</option>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} out of 5</option>)}</select></label><label>Your feedback<textarea name="message" minLength={10} maxLength={2000} required rows={5}/></label><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="checkbox-label"><input type="checkbox" name="consent" required/><span>I agree that the team may store this feedback and contact me about it. It will not be published automatically.</span></label><p className="fine">Please don’t include passwords or sensitive information. Contact our office to request deletion of your feedback.</p>{error&&<p role="alert" className="alert error">{error}</p>}<button className="button" disabled={busy}>{busy?'Sending…':'Send feedback'}</button></form>;
}
