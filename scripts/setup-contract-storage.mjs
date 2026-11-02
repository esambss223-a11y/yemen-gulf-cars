process.loadEnvFile('.env.local');
const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
const bucket = 'rental-contracts';
const exists = await fetch(origin + '/storage/v1/bucket/' + bucket, { headers });
if (exists.ok) {
  if ((await exists.json()).public !== false) throw new Error('Contract bucket is public. Stop: private storage required.');
  console.log('Private contract bucket already exists; settings and files unchanged.');
} else {
  const error = await exists.json();
  if (exists.status !== 404 && String(error.statusCode) !== '404') throw new Error('Could not verify contract bucket: HTTP ' + exists.status);
  const created = await fetch(origin + '/storage/v1/bucket', { method: 'POST', headers, body: JSON.stringify({ id: bucket, name: bucket, public: false, file_size_limit: 4194304, allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] }) });
  if (!created.ok) throw new Error('Could not create private bucket: HTTP ' + created.status);
  console.log('Private contract bucket created. 4 MiB per file; plan unchanged; no existing files modified.');
}
