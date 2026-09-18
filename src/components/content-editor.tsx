'use client';
import {useRef,useState} from 'react';
import type {User} from 'firebase/auth';
import type {Content} from '@/lib/schema';
import {FileUpload} from './file-upload';
type Section=keyof Content;
export function ContentEditor({initial,user,onSaved}:{initial:Content;user:User;onSaved:(patch:Partial<Content>)=>void}){
 const [content,setContent]=useState(initial);
 const savedGallery=useRef(initial.gallery);
 // Each draft keeps its original saved photo, even when its upload or caption changes.
 const galleryOrigins=useRef<(Content['gallery'][number]|null)[]>([...initial.gallery]);
 const [busy,setBusy]=useState<Section|null>(null),[uploading,setUploading]=useState(false);
 const [notice,setNotice]=useState<Partial<Record<Section,string>>>({}),[error,setError]=useState<Partial<Record<Section,string>>>({});
 const [dirty,setDirty]=useState<Partial<Record<Section,boolean>>>({});
 function change<K extends Section>(section:K,update:(value:Content[K])=>Content[K]){
  setContent(current=>({...current,[section]:update(current[section])}));setDirty(current=>({...current,[section]:true}));setNotice(current=>({...current,[section]:''}));
 }
 async function save(section:Section,e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(uploading||busy)return;
  setBusy(section);setError(current=>({...current,[section]:''}));setNotice(current=>({...current,[section]:''}));
  try{
   const response=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await user.getIdToken()},body:JSON.stringify({action:'contentSection',value:{section,value:content[section]}})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to save.');
   if(section==='gallery'){savedGallery.current=content.gallery;galleryOrigins.current=[...content.gallery];}
   onSaved({[section]:content[section]});setDirty(current=>({...current,[section]:false}));
   setNotice(current=>({...current,[section]:section==='gallery'?'Gallery published successfully. Your saved photos are now on the Gallery page.':section==='trainers'?'Trainer profiles saved and published.':'Testimonials saved and published.'}));
  }catch(e){setError(current=>({...current,[section]:e instanceof Error?e.message:'Please try again.'}));}finally{setBusy(null);}
 }
 async function removePhoto(index:number){
  if(uploading||busy)return;
  const origin=galleryOrigins.current[index];
  const remaining=content.gallery.filter((_,i)=>i!==index);
  if(!origin){
   galleryOrigins.current.splice(index,1);
   change('gallery',()=>remaining);
   setError(current=>({...current,gallery:''}));
   setNotice(current=>({...current,gallery:'Unpublished photo removed.'}));
   return;
  }
  if(!window.confirm('Remove this photo from the public gallery?'))return;
  setBusy('gallery');setError(current=>({...current,gallery:''}));setNotice(current=>({...current,gallery:''}));
  try{
   const response=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await user.getIdToken()},body:JSON.stringify({action:'galleryRemove',value:{expected:savedGallery.current,index:savedGallery.current.indexOf(origin)}})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to remove photo. Please try again.');
   galleryOrigins.current.splice(index,1);
   savedGallery.current=savedGallery.current.filter(item=>item!==origin);
   setContent(current=>({...current,gallery:remaining}));
   onSaved({gallery:result.gallery});
   setDirty(current=>({...current,gallery:JSON.stringify(remaining)!==JSON.stringify(result.gallery)}));
   setNotice(current=>({...current,gallery:'Photo removed from the public gallery. No additional save is needed.'}));
  }catch(e){setError(current=>({...current,gallery:e instanceof Error?e.message:'Unable to remove photo. Please try again.'}));}
  finally{setBusy(null);}
 }
 function status(section:Section){return <>{dirty[section]&&<p className="alert" role="status">Unsaved {section} changes. {section==='gallery'?'Click Publish gallery to show these photos on the site.':'Save this section to publish your changes.'}</p>}{notice[section]&&<p className="alert upload-success" role="status">{notice[section]} {section==='gallery'&&<a href="/gallery" target="_blank" rel="noreferrer">View gallery ↗</a>}</p>}{error[section]&&<p className="alert error" role="alert">{error[section]}</p>}</>;}
 const disabled=!!busy||uploading;
 return <div><p>Gallery, trainers, and testimonials save independently. Only publish images and feedback you have permission to share.</p>
 <form className="form-card" onSubmit={e=>save('gallery',e)}><fieldset className="upload-fieldset" disabled={disabled}><h2>Gallery</h2><p>Add a photo, upload its image, enter a caption, then publish your gallery. Removing a published photo saves immediately.</p>
 {content.gallery.map((g,i)=><div className="program-editor" key={i}><h3>Photo {i+1}</h3><FileUpload value={g.url} onBusy={setUploading} successMessage="Image uploaded successfully. Add a caption and click Publish gallery to show it on the site." onUploaded={url=>change('gallery',items=>items.map((item,j)=>i===j?{...item,url}:item))}/><label>Caption / image description<input required maxLength={200} value={g.caption} onChange={e=>change('gallery',items=>items.map((item,j)=>i===j?{...item,caption:e.target.value}:item))}/></label><button className="text-button" type="button" onClick={()=>removePhoto(i)}>Remove photo</button></div>)}
 <button type="button" className="button secondary small" disabled={disabled||content.gallery.length>=40} onClick={()=>{galleryOrigins.current.push(null);change('gallery',items=>[...items,{url:'',caption:''}]);}}>Add gallery photo</button>
 {status('gallery')}<div className="button-row"><button className="button" disabled={disabled||content.gallery.some(g=>!g.url)}>{busy==='gallery'?'Publishing…':'Publish gallery'}</button></div>{content.gallery.some(g=>!g.url)&&<p className="fine">Upload an image for each photo before publishing.</p>}</fieldset></form>
 <form className="form-card" onSubmit={e=>save('trainers',e)}><fieldset className="upload-fieldset" disabled={disabled}><h2>Trainers</h2>
 {content.trainers.map((t,i)=><div className="program-editor" key={i}><div className="two-grid">{(['name','title'] as const).map(key=><label key={key}>{key==='name'?'Name':'Title'}<input required={key==='name'} maxLength={key==='name'?100:150} value={t[key]} onChange={e=>change('trainers',items=>items.map((item,j)=>i===j?{...item,[key]:e.target.value}:item))}/></label>)}</div><div className="two-grid">{(['photoUrl','signatureUrl'] as const).map(key=><div key={key}><h3>{key==='photoUrl'?'Profile photo':'Signature'}</h3><FileUpload value={t[key]} onBusy={setUploading} successMessage="Image uploaded successfully. Click Save trainers to publish this change." onUploaded={url=>change('trainers',items=>items.map((item,j)=>i===j?{...item,[key]:url}:item))}/>{t[key]&&<button className="text-button" type="button" onClick={()=>change('trainers',items=>items.map((item,j)=>i===j?{...item,[key]:''}:item))}>Remove image</button>}</div>)}</div><label>Biography<textarea maxLength={1000} value={t.bio} onChange={e=>change('trainers',items=>items.map((item,j)=>i===j?{...item,bio:e.target.value}:item))}/></label><button className="text-button" type="button" onClick={()=>change('trainers',items=>items.filter((_,j)=>j!==i))}>Remove trainer</button></div>)}
 <button type="button" className="button secondary small" disabled={disabled||content.trainers.length>=10} onClick={()=>change('trainers',items=>[...items,{name:'',title:'',bio:'',photoUrl:'',signatureUrl:''}])}>Add trainer</button><p className="fine">Existing certificates retain their original trainers and signatures.</p>{status('trainers')}<button className="button" disabled={disabled}>{busy==='trainers'?'Saving…':'Save trainers'}</button></fieldset></form>
 <form className="form-card" onSubmit={e=>save('testimonials',e)}><fieldset className="upload-fieldset" disabled={disabled}><h2>Testimonials</h2>
 {content.testimonials.map((t,i)=><div className="program-editor" key={i}>{(['name','detail','quote'] as const).map(key=><label key={key}>{{name:'Participant name',detail:'Description / workshop',quote:'Their feedback'}[key]}<textarea required={key!=='detail'} maxLength={key==='quote'?1000:key==='name'?100:150} value={t[key]} onChange={e=>change('testimonials',items=>items.map((item,j)=>i===j?{...item,[key]:e.target.value}:item))}/></label>)}<button className="text-button" type="button" onClick={()=>change('testimonials',items=>items.filter((_,j)=>j!==i))}>Remove testimonial</button></div>)}
 <button type="button" className="button secondary small" disabled={disabled||content.testimonials.length>=40} onClick={()=>change('testimonials',items=>[...items,{name:'',detail:'',quote:''}])}>Add testimonial</button>{status('testimonials')}<div className="button-row"><button className="button" disabled={disabled}>{busy==='testimonials'?'Saving…':'Save testimonials'}</button></div></fieldset></form></div>;
}
