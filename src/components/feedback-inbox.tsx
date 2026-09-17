'use client';
import {useCallback,useEffect,useState} from 'react';
import type {User} from 'firebase/auth';
import type {Feedback} from '@/lib/feedback';
export function FeedbackInbox({user}:{user:User}){
 const [items,setItems]=useState<Feedback[]>([]),[cursor,setCursor]=useState<string|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState('');
 const load=useCallback(async(after?:string)=>{
  setBusy(true);setError('');
  try {const response=await fetch('/api/feedback'+(after?'?cursor='+encodeURIComponent(after):''),{headers:{Authorization:'Bearer '+await user.getIdToken()},cache:'no-store'});const result=await response.json();if(!response.ok)throw new Error(result.error);setItems(old=>after?[...old,...result.feedback]:result.feedback);setCursor(result.nextCursor);}
  catch(e){setError(e instanceof Error?e.message:'Unable to load feedback.');}finally{setBusy(false);}
 },[user]);
 useEffect(()=>{void load();},[load]);
 return <section><div className="section-heading"><h2>Visitor feedback</h2><button className="button secondary small" disabled={busy} onClick={()=>load()}>Refresh</button></div><p>Private messages for your team. Get the visitor’s permission before publishing a testimonial.</p>{error&&<p className="alert error" role="alert">{error}</p>}{busy&&<p role="status">Loading feedback…</p>}{!busy&&!error&&!items.length&&<p className="card">No feedback yet.</p>}<div className="two-grid">{items.map(item=><article className="card" key={item.id}><h3>{item.name}</h3><p>{item.rating} / 5 · {new Date(item.createdAt).toLocaleDateString('en-GB',{timeZone:'Africa/Monrovia'})}</p><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{item.message}</p>{item.email&&<p className="break">{item.email}</p>}</article>)}</div>{cursor&&<button className="button secondary" disabled={busy} onClick={()=>load(cursor)}>Load more feedback</button>}</section>;
}
