import test from 'node:test';
import assert from 'node:assert/strict';
import {blobOptions} from '../src/lib/blob-config';
test('custom-prefix store uses OIDC on Vercel without a read-write token',()=>{
 assert.deepEqual(blobOptions({mcl_photos_STORE_ID:'store_custom',VERCEL:'1'}),{storeId:'store_custom'});
});
test('OIDC takes precedence over a legacy token on Vercel',()=>{
 assert.deepEqual(blobOptions({mcl_photos_STORE_ID:'store_custom',mcl_photos_READ_WRITE_TOKEN:'legacy-test-token',VERCEL:'1'}),{storeId:'store_custom'});
});
test('custom token supports local and token-only connections',()=>{
 assert.deepEqual(blobOptions({mcl_photos_STORE_ID:'store_custom',mcl_photos_READ_WRITE_TOKEN:'local-test-token'}),{token:'local-test-token'});
 assert.deepEqual(blobOptions({mcl_photos_READ_WRITE_TOKEN:'local-test-token'}),{token:'local-test-token'});
});
test('default-prefix connections work and custom store is not mixed with default token',()=>{
 assert.deepEqual(blobOptions({BLOB_STORE_ID:'store_default',VERCEL:'1'}),{storeId:'store_default'});
 assert.deepEqual(blobOptions({BLOB_READ_WRITE_TOKEN:'default-test-token'}),{token:'default-test-token'});
 assert.deepEqual(blobOptions({mcl_photos_STORE_ID:'store_custom',BLOB_READ_WRITE_TOKEN:'different-store-token'}),{storeId:'store_custom'});
});
test('missing or blank configuration gives a useful setup error',()=>{
 assert.throws(()=>blobOptions({}),/Connect your public Blob store/);
 assert.throws(()=>blobOptions({mcl_photos_STORE_ID:'  ',BLOB_READ_WRITE_TOKEN:''}),/Connect your public Blob store/);
});
