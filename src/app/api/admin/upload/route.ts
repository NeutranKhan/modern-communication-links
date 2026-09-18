import {randomUUID} from 'node:crypto';
import {put} from '@vercel/blob';
import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin,requireOrigin,throttle,fail,HttpError,privateHeaders} from '@/lib/server';
import {MAX_UPLOAD_BYTES,prepareUpload,readUpload} from '@/lib/uploads';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
 const uid=await requireAdmin(req);requireOrigin(req);
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw new HttpError(503,'Connect your public Vercel Blob store to this project for Production, then redeploy. BLOB_READ_WRITE_TOKEN is required.');
 const kind=req.headers.get('x-upload-kind');
 if(kind!=='image'&&kind!=='certificate')throw new HttpError(400,'Invalid upload type.');
 const length=Number(req.headers.get('content-length')??0);
 if(length>MAX_UPLOAD_BYTES)throw new HttpError(413,'Choose a file smaller than 4 MB.');
 await throttle('admin-upload:'+uid,60);
 const file=await prepareUpload(await readUpload(req.body),(req.headers.get('content-type')??'').split(';')[0],kind);
 try{
  const blob=await put((kind==='certificate'?'certificates/':'images/')+randomUUID()+'.'+file.extension,file.bytes,{access:'public',contentType:file.contentType,token:process.env.BLOB_READ_WRITE_TOKEN,addRandomSuffix:true});
  return NextResponse.json({url:blob.url},{status:201,headers:privateHeaders});
 }catch{throw new HttpError(502,'Upload failed. Check that your Blob store is public, connected, and within its usage limits, then try again.');}
}catch(e){return fail(e);}}
