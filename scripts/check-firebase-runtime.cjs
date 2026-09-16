// Regression: serverless runtimes may disable synchronous require(ESM).
// This check must pass without credentials or network access.
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { generateKeyPairSync, createPublicKey } = require('node:crypto');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
assert.equal(typeof getAuth, 'function');
assert.equal(typeof getFirestore, 'function');

async function checkSigningKeys() {
  const adminRequire = createRequire(require.resolve('firebase-admin/auth'));
  const jwksRequire = createRequire(adminRequire.resolve('jwks-rsa'));
  const { retrieveSigningKeys } = jwksRequire('./utils');
  const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), use: 'sig', alg: 'RS256', kid: 'runtime-test' };
  const keys = await retrieveSigningKeys([jwk]);
  assert.equal(keys.length, 1);
  assert.equal(keys[0].kid, 'runtime-test');
  assert.deepEqual(createPublicKey(keys[0].getPublicKey()).export({ format: 'jwk' }), publicKey.export({ format: 'jwk' }));
  console.log('Firebase startup and RSA signing-key conversion passed with require(ESM) disabled.');
}
checkSigningKeys().catch(error => { console.error(error); process.exitCode = 1; });
