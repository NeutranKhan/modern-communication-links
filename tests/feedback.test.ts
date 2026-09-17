import test from 'node:test';
import assert from 'node:assert/strict';
import {feedbackSchema} from '../src/lib/feedback';
import {workshopLink} from '../src/lib/site';
const input={name:'Visitor',email:'',rating:5,message:'A useful workshop experience.',consent:true,website:''};
test('feedback accepts no email and trims names',()=>{assert.equal(feedbackSchema.parse({...input,name:' Visitor '}).name,'Visitor');});
test('feedback rejects missing consent, invalid ratings, spam and oversized messages',()=>{
 for(const invalid of [{consent:false},{rating:6},{rating:2.5},{message:'short'},{message:'x'.repeat(2001)},{email:'invalid'},{website:'spam'}])assert.equal(feedbackSchema.safeParse({...input,...invalid}).success,false);
});
test('sharing uses the public domain and encodes workshop identifiers',()=>{
 assert.equal(workshopLink(),'https://moderncommunicationlinks.com/workshops');
 assert.equal(workshopLink('a&b'),'https://moderncommunicationlinks.com/register?workshop=a%26b');
});
