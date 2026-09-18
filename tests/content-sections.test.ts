import test from 'node:test';
import assert from 'node:assert/strict';
import {contentPatch} from '../src/lib/content-sections';
test('gallery saves validate and update only gallery, independent of testimonial drafts',()=>{
 const gallery=[{url:'https://example.com/photo.webp',caption:'Learners at a workshop'}];
 const patch=contentPatch({section:'gallery',value:gallery});
 assert.deepEqual(Object.keys(patch),['gallery']);
 const existing={trainers:[{name:'Trainer'}],testimonials:[{name:'Existing',quote:'Great workshop'}]};
 assert.deepEqual({...existing,...patch},{...existing,gallery});
});
test('section validation rejects missing images or captions without accepting other sections',()=>{
 assert.throws(()=>contentPatch({section:'gallery',value:[{url:'',caption:'Workshop'}]}));
 assert.throws(()=>contentPatch({section:'gallery',value:[{url:'https://example.com/photo.webp',caption:''}]}));
 assert.throws(()=>contentPatch({section:'unknown',value:[]}));
});
test('trainers and testimonials can be saved or cleared without changing gallery',()=>{
 assert.deepEqual(contentPatch({section:'trainers',value:[]}),{trainers:[]});
 assert.deepEqual(contentPatch({section:'testimonials',value:[]}),{testimonials:[]});
});
