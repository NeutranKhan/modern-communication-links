import 'server-only';
import {adminServices,configured} from './firebase-admin';
import {Content,defaultContent,Workshop} from './schema';
export async function publicData():Promise<{workshops:Workshop[];content:Content;state:'ready'|'setup'|'error'}> {
 if (!configured()) return {workshops:[],content:defaultContent,state:'setup'};
 try { const {db}=adminServices(); const [events,content]=await Promise.all([db.collection('workshops').where('published','==',true).get(),db.doc('content/site').get()]); return {workshops:events.docs.map(d => ({...d.data(),id:d.id}) as Workshop).sort((a,b)=>a.startAt.localeCompare(b.startAt)),content:content.exists ? content.data() as Content : defaultContent,state:'ready'}; } catch(e) { console.error('Public content unavailable',e instanceof Error ? e.name : 'unknown'); return {workshops:[],content:defaultContent,state:'error'}; }
}
export function dateLabel(value:string) { return new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeZone:'Africa/Monrovia'}).format(new Date(value)); }