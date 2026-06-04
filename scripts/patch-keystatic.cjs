/**
 * Patch Keystatic OAuth for GitHub OAuth App compatibility
 *
 * Bug 1: Keystatic omits redirect_uri from token exchange, causing bad_verification_code
 * Bug 2: GitHub OAuth App doesn't return refresh_token/expires_in, causing validation failure
 * Bug 3: Authorization URL missing scope parameter, token has no permissions (can't write)
 *
 * This script patches the compiled Keystatic source at build time.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@keystatic',
  'core',
  'dist',
  'keystatic-core-api-generic.node.js'
);

if (!fs.existsSync(filePath)) {
  console.log('[patch-keystatic] File not found, skipping patch:', filePath);
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');
let patched = false;

// Patch 1: Add redirect_uri to token exchange
const target1 = "url.searchParams.set('code', code);";
const replacement1 = `url.searchParams.set('code', code);
  url.searchParams.set('redirect_uri', \`\${new URL(req.url).origin}/api/keystatic/github/oauth/callback\`);`;

if (content.includes(replacement1)) {
  console.log('[patch-keystatic] Patch 1 (redirect_uri) already applied, skipping.');
} else if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  patched = true;
  console.log('[patch-keystatic] Patch 1 applied: Added redirect_uri to token exchange.');
} else {
  console.log('[patch-keystatic] Patch 1 target not found. The bug may have been fixed upstream.');
}

// Patch 2: Add default values for missing fields from GitHub OAuth App
const target2 = "const _tokenData = await tokenRes.json();";
const replacement2 = `const _tokenData = await tokenRes.json();
  if (typeof _tokenData.expires_in !== 'number') _tokenData.expires_in = 28800;
  if (typeof _tokenData.refresh_token !== 'string') _tokenData.refresh_token = 'none';
  if (typeof _tokenData.refresh_token_expires_in !== 'number') _tokenData.refresh_token_expires_in = 15811200;`;

if (content.includes(replacement2)) {
  console.log('[patch-keystatic] Patch 2 (default values) already applied, skipping.');
} else if (content.includes(target2)) {
  content = content.replaceAll(target2, replacement2);
  patched = true;
  console.log('[patch-keystatic] Patch 2 applied: Added default values for OAuth App missing fields.');
} else {
  console.log('[patch-keystatic] Patch 2 target not found.');
}

// Patch 3: Add scope=public_repo to GitHub authorization URL
const target3 = "url.searchParams.set('redirect_uri', `${reqUrl.origin}/api/keystatic/github/oauth/callback`);\n  if (from === '/')";
const replacement3 = "url.searchParams.set('redirect_uri', `${reqUrl.origin}/api/keystatic/github/oauth/callback`);\n  url.searchParams.set('scope', 'public_repo');\n  if (from === '/')";

if (content.includes("url.searchParams.set('scope', 'public_repo')")) {
  console.log('[patch-keystatic] Patch 3 (scope) already applied, skipping.');
} else if (content.includes(target3)) {
  content = content.replace(target3, replacement3);
  patched = true;
  console.log('[patch-keystatic] Patch 3 applied: Added scope=public_repo to authorization URL.');
} else {
  console.log('[patch-keystatic] Patch 3 target not found.');
}

if (patched) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[patch-keystatic] Patches applied successfully.');
} else {
  console.log('[patch-keystatic] No patches needed.');
}
