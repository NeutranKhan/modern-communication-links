import type {Metadata} from 'next';
export const siteUrl='https://moderncommunicationlinks.com';
export function workshopLink(id?:string) { return siteUrl+(id?'/register?workshop='+encodeURIComponent(id):'/workshops'); }
export function socialMetadata(title:string,path:string,description='Practical AI workshops in Liberia. Learn with Modern Communication Links, register online, and pay in person.'):Metadata['openGraph'] {
 return {type:'website',siteName:'Modern Communication Links',title,description,url:siteUrl+path,images:[{url:siteUrl+'/mcl-logo.png',alt:'Modern Communication Links'}]};
}
