import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {MAX_UPLOAD_BYTES,prepareUpload,readUpload} from '../src/lib/uploads';
test('photos are resized, retain transparency, and become WebP',async()=>{
 const source=await sharp({create:{width:2400,height:100,channels:4,background:{r:40,g:80,b:200,alpha:0.5}}}).png().toBuffer();
 const result=await prepareUpload(source,'image/png','image');
 const metadata=await sharp(result.bytes).metadata();
 assert.equal(result.contentType,'image/webp');assert.equal(metadata.width,2000);assert.equal(metadata.hasAlpha,true);
});
test('certificate images preserve more detail',async()=>{
 const source=await sharp({create:{width:2400,height:100,channels:3,background:'white'}}).png().toBuffer();
 const result=await prepareUpload(source,'image/png','certificate');
 assert.equal((await sharp(result.bytes).metadata()).width,2400);
});
test('PDF uploads are restricted to certificates and reject obvious invalid files',async()=>{
 const pdf=Buffer.from('%PDF-1.7\nexample\n%%EOF');
 assert.deepEqual((await prepareUpload(pdf,'application/pdf','certificate')).bytes,pdf);
 await assert.rejects(prepareUpload(pdf,'application/pdf','image'),/Choose a JPG/);
 await assert.rejects(prepareUpload(Buffer.from('not a pdf'),'application/pdf','certificate'),/valid PDF/);
});
test('images reject spoofed MIME, unsupported formats, corrupt files and oversize bodies',async()=>{
 const png=await sharp({create:{width:2,height:2,channels:3,background:'white'}}).png().toBuffer();
 await assert.rejects(prepareUpload(png,'image/jpeg','image'),/cannot be read/);
 await assert.rejects(prepareUpload(Buffer.from('<svg/>'),'image/svg+xml','image'),/Choose a JPG/);
 await assert.rejects(prepareUpload(Buffer.from('broken'),'image/png','image'),/cannot be read/);
 await assert.rejects(prepareUpload(Buffer.alloc(MAX_UPLOAD_BYTES+1),'image/png','image'),/up to 4 MB/);
});
test('stream limit applies even without content-length',async()=>{
 let cancelled=false;
 const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(MAX_UPLOAD_BYTES));c.enqueue(new Uint8Array(1));},cancel(){cancelled=true;}});
 await assert.rejects(readUpload(stream),/smaller than 4 MB/);assert.ok(cancelled);
 await assert.rejects(readUpload(new ReadableStream({start(c){c.close();}})),/empty/);
});
