import sharp from 'sharp';
import {HttpError} from './http-error';
export const MAX_UPLOAD_BYTES=4*1024*1024;
export async function readUpload(stream:ReadableStream<Uint8Array>|null){
 if(!stream)throw new HttpError(400,'Choose a file to upload.');
 const reader=stream.getReader();const chunks:Buffer[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_UPLOAD_BYTES){await reader.cancel();throw new HttpError(413,'Choose a file smaller than 4 MB.');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
 if(!size)throw new HttpError(400,'The selected file is empty.');
 return Buffer.concat(chunks);
}
export async function prepareUpload(bytes:Buffer,mime:string,kind:'image'|'certificate'){
 if(!bytes.length||bytes.length>MAX_UPLOAD_BYTES)throw new HttpError(400,'Choose a non-empty file up to 4 MB.');
 if(kind==='certificate'&&mime==='application/pdf'){
  if(!bytes.subarray(0,5).equals(Buffer.from('%PDF-'))||!bytes.subarray(-1024).includes(Buffer.from('%%EOF')))throw new HttpError(400,'This file is not a valid PDF.');
  return {bytes,extension:'pdf',contentType:'application/pdf'};
 }
 const types:Record<string,string>={'image/jpeg':'jpeg','image/png':'png','image/webp':'webp'};
 if(!types[mime])throw new HttpError(400,kind==='certificate'?'Choose a PDF, JPG, PNG, or WebP file.':'Choose a JPG, PNG, or WebP image.');
 try{
  const input=sharp(bytes,{limitInputPixels:25_000_000,failOn:'warning'});
  const metadata=await input.metadata();
  if(metadata.format!==types[mime]||(metadata.pages??1)>1)throw new Error('Unsupported image');
  const size=kind==='certificate'?4000:2000;
  const output=await input.rotate().resize({width:size,height:size,fit:'inside',withoutEnlargement:true}).webp(kind==='certificate'?{lossless:true}:{quality:85}).toBuffer();
  return {bytes:output,extension:'webp',contentType:'image/webp'};
 }catch{throw new HttpError(400,'This image cannot be read. Use a still JPG, PNG, or WebP image under 25 megapixels.');}
}
