import {z} from 'zod';
import {contentSchema} from './schema';
export const contentSectionSchema=z.discriminatedUnion('section',[
 z.object({section:z.literal('gallery'),value:contentSchema.shape.gallery}),
 z.object({section:z.literal('trainers'),value:contentSchema.shape.trainers}),
 z.object({section:z.literal('testimonials'),value:contentSchema.shape.testimonials})
]);
export function contentPatch(input:unknown){const parsed=contentSectionSchema.parse(input);return {[parsed.section]:parsed.value};}

export const galleryRemovalSchema=z.object({expected:contentSchema.shape.gallery,index:z.number().int().min(0).max(39)});
// Compare the saved snapshot so another administrator's edits cannot be deleted accidentally.
export function removeGalleryPhoto(current:unknown,input:unknown){
 const {expected,index}=galleryRemovalSchema.parse(input);
 const gallery=contentSchema.shape.gallery.parse(current);
 if(JSON.stringify(gallery)!==JSON.stringify(expected)||index>=gallery.length)return null;
 return gallery.filter((_,i)=>i!==index);
}
