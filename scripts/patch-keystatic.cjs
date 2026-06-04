/**
 * Patch Keystatic OAuth token exchange to include redirect_uri
 * Bug fix: Keystatic omits redirect_uri from token exchange, causing bad_verification_code
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

const target = "url.searchParams.set('code', code);";
const replacement = `url.searchParams.set('code', code);
  url.searchParams.set('redirect_uri', \`\${new URL(req.url).origin}/api/keystatic/github/oauth/callback\`);`;

if (content.includes(replacement)) {
  console.log('[patch-keystatic] Patch already applied, skipping.');
  process.exit(0);
}

if (!content.includes(target)) {
  console.log('[patch-keystatic] Target string not found, cannot patch.');
  process.exit(1);
}

content = content.replace(target, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('[patch-keystatic] Successfully patched redirect_uri into token exchange.');
