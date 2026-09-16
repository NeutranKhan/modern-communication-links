import { z } from 'zod';
export const office = 'Snow Hill Community Junction, Gardnersville Supermarket, Montserrado County, Liberia';
export const phoneSchema = z.string().trim().transform(v => v.replace(/[\s()-]/g, '')).refine(v => /^(?:0\d{9}|\+231\d{9})$/.test(v), 'Use a 10-digit Liberian number or +231 followed by 9 digits.').transform(v => v.startsWith('0') ? '+231' + v.slice(1) : v);
const text = (max = 200) => z.string().trim().min(1).max(max);
const date = z.iso.datetime();
const safeUrl = z.union([z.literal(''), z.url().refine(v => v.startsWith('https://'), 'Use an HTTPS URL.')]);
export const workshopSchema = z.object({
 id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/), title: text(120), summary: text(600), startAt: date, endAt: date,
 venue: text(), city: text(100), capacity: z.coerce.number().int().min(1).max(5000), price: z.coerce.number().min(0).max(10000).multipleOf(0.01).default(20),
 registrationDeadline: date, paymentDeadline: date, paymentLocation: text(400).default(office), published: z.boolean(),
 program: z.array(z.object({title:text(100), description:text(1000)})).min(1).max(10)
}).refine(w => Date.parse(w.endAt) > Date.parse(w.startAt), 'End must be after start.').refine(w => Date.parse(w.registrationDeadline) <= Date.parse(w.paymentDeadline) && Date.parse(w.paymentDeadline) < Date.parse(w.startAt), 'Registration deadline must be on or before payment deadline, which must be before the workshop.');
export type Workshop = z.infer<typeof workshopSchema> & { reserved: number };
export const registrationSchema = z.object({workshopId:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),fullName:text(100),phone:phoneSchema,email:z.email().max(160),occupation:text(100),city:text(100),gender:z.enum(['','Female','Male','Prefer not to say']).default(''),consent:z.literal(true),website:z.string().max(0).default('')});
export const lookupSchema = z.object({reference:z.string().trim().toUpperCase().regex(/^MCL-[A-F0-9]{16}$/),phone:phoneSchema});
export const participantUpdateSchema = z.object({reference:lookupSchema.shape.reference,paymentStatus:z.enum(['pending','paid','cancelled']),attendance:z.array(z.number().int().min(1).max(10)).max(10)}).refine(v => v.attendance.length === 0 || v.paymentStatus === 'paid', 'Only paid participants can be marked present.');
export const contentSchema = z.object({trainers:z.array(z.object({name:text(100),title:z.string().max(150),bio:z.string().max(1000),photoUrl:safeUrl,signatureUrl:safeUrl})).max(10),gallery:z.array(z.object({url:safeUrl.refine(Boolean),caption:text(200)})).max(40),testimonials:z.array(z.object({name:text(100),quote:text(1000),detail:z.string().max(150)})).max(40)});
export type Content = z.infer<typeof contentSchema>;
export const defaultContent:Content = {trainers:['Michael Khan','Teddy Morris'].map(name => ({name,title:'',bio:'',photoUrl:'',signatureUrl:''})),gallery:[],testimonials:[]};
export type Participant = {reference:string;workshopId:string;workshopTitle:string;fullName:string;phone:string;email:string;occupation:string;city:string;gender:string;paymentStatus:'pending'|'paid'|'cancelled';certificate?:CertificateSummary;attendance:number[];price:number;createdAt:string;updatedAt?:string};
export function registrationProblem(w:Workshop, now=Date.now()) { if (!w.published) return 'This workshop is not available.'; if (now > Date.parse(w.registrationDeadline)) return 'Registration has closed.'; if (w.reserved >= w.capacity) return 'This workshop is full.'; return null; }
export function capacityDelta(previous:Participant['paymentStatus'],next:Participant['paymentStatus']) { return Number(next !== 'cancelled') - Number(previous !== 'cancelled'); }
export const certificateSchema = z.object({
 reference:lookupSchema.shape.reference,
 completionDate:z.iso.date().refine(v=>v<=new Date().toISOString().slice(0,10),'Completion date cannot be in the future.'),
 certificateUrl:safeUrl,
 publicVerificationConsent:z.boolean(),
 completionConfirmed:z.literal(true),
 status:z.enum(['valid','revoked'])
});
export type CertificateSummary={code:string;completionDate:string;certificateUrl:string;publicVerificationConsent:boolean;status:'valid'|'revoked'};
export function certificateProblem(p:Pick<Participant,'paymentStatus'>, endAt:string, completionDate:string, now=Date.now()) {
 if(p.paymentStatus!=='paid')return 'Confirm payment before issuing a certificate.';
 if(Date.parse(endAt)>now)return 'Certificates can be issued after the workshop ends.';
 if(completionDate<endAt.slice(0,10))return 'Completion date cannot be before the workshop ends.';
 return null;
}
