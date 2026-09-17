'use client';
import {useState} from 'react';
import {workshopLink} from '@/lib/site';
export function ShareWorkshop({workshopId,title='AI workshops at Modern Communication Links'}:{workshopId?:string;title?:string}) {
 const [notice,setNotice]=useState('');
 const [manual,setManual]=useState(false);
 const url=workshopLink(workshopId);
 async function copy() {
  try {await navigator.clipboard.writeText(url);setNotice('Link copied. Paste it into your message or Facebook ad.');setManual(false);}
  catch {setManual(true);setNotice('Select and copy the link below.');}
 }
 async function share() {
  if(!navigator.share){await copy();return;}
  try {await navigator.share({title,text:title,url});}
  catch(error){if(!(error instanceof Error&&error.name==='AbortError'))await copy();}
 }
 return <div className="share-controls"><p className="fine">Invite someone to learn with you</p><div className="button-row">
 <button type="button" className="button secondary small" onClick={copy}>Copy link</button>
 <button type="button" className="button secondary small" onClick={share}>Share</button>
 <a className="text-link" target="_blank" rel="noopener noreferrer" href={'https://wa.me/?text='+encodeURIComponent(title+' '+url)}>WhatsApp ↗</a>
 <a className="text-link" target="_blank" rel="noopener noreferrer" href={'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)}>Facebook ↗</a>
 </div><p role="status" className="fine">{notice}</p>{manual&&<label>Link to share<input readOnly value={url} onFocus={e=>e.target.select()}/></label>}</div>;
}
