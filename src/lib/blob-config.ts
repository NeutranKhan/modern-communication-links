import {HttpError} from './http-error';
// Keep credentials server-side. The SDK obtains and refreshes Vercel OIDC itself.
export function blobOptions(env:Record<string,string|undefined>=process.env):{storeId:string}|{token:string}{
 const customId=env.mcl_photos_STORE_ID?.trim();
 const customToken=env.mcl_photos_READ_WRITE_TOKEN?.trim();
 const custom=Boolean(customId||customToken);
 const storeId=custom?customId:env.BLOB_STORE_ID?.trim();
 const token=custom?customToken:env.BLOB_READ_WRITE_TOKEN?.trim();
 if(storeId&&(env.VERCEL==='1'||env.VERCEL_OIDC_TOKEN?.trim()||!token))return {storeId};
 if(token)return {token};
 throw new HttpError(503,'Connect your public Blob store for Production and redeploy so the mcl_photos_STORE_ID or BLOB_STORE_ID setting is available.');
}
