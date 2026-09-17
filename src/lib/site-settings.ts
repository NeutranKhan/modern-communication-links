import {z} from 'zod';
import {office,phoneSchema} from './schema';
const text=(max:number)=>z.string().trim().min(1).max(max);
export const siteSettingsSchema=z.object({
 phone1:phoneSchema,phone2:phoneSchema,email:z.email().max(160),
 facebook:z.url().refine(s=>s.startsWith('https://'),'Use an HTTPS link.'),
 office:text(400),defaultPrice:z.number().min(0).max(10000).multipleOf(0.01),
 heroLine1:text(100),heroLine2:text(100),heroLine3:text(100),heroDescription:text(600),
 about:text(4000)
});
export type SiteSettings=z.infer<typeof siteSettingsSchema>;
export const defaultSettings:SiteSettings={
 phone1:'+231770726497',phone2:'+231775972161',email:'moderncommunicationlinks@gmail.com',
 facebook:'https://www.facebook.com/share/1GjjkcvZhK/?mibextid=wwXlfr',office,defaultPrice:20,
 heroLine1:'Big possibilities.',heroLine2:'Practical skills.',heroLine3:'Your next move.',
 heroDescription:'Make AI part of what you do next. Hands-on workshops for work, business, and everyday ideas — with trainers right here in Liberia.',
 about:'Modern Communication Links brings practical AI training to learners in Liberia. Our workshops are designed to help people explore useful tools and put them to work in everyday life.\n\nWe welcome students, business owners, professionals, and anyone ready to learn. Our approach is simple: understand the basics, practice together, and build confidence one step at a time.'
};
export function phoneLabel(phone:string){return phone.startsWith('+231')?'0'+phone.slice(4):phone;}
