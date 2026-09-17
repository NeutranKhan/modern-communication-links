import {z} from 'zod';
export const feedbackSchema=z.object({
 name:z.string().trim().min(2).max(100),
 email:z.union([z.literal(''),z.email().max(160)]).default(''),
 rating:z.number().int().min(1).max(5),
 message:z.string().trim().min(10).max(2000),
 consent:z.literal(true),
 website:z.string().max(0).default('')
});
export type Feedback={id:string;reviewed?:boolean;name:string;email:string;rating:number;message:string;createdAt:string};
