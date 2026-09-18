import {z} from 'zod';
import {contentSchema} from './schema';
export const contentSectionSchema=z.discriminatedUnion('section',[
 z.object({section:z.literal('gallery'),value:contentSchema.shape.gallery}),
 z.object({section:z.literal('trainers'),value:contentSchema.shape.trainers}),
 z.object({section:z.literal('testimonials'),value:contentSchema.shape.testimonials})
]);
export function contentPatch(input:unknown){const parsed=contentSectionSchema.parse(input);return {[parsed.section]:parsed.value};}
