// Creates only the dedicated bucket; never changes existing files or subscription.
process.loadEnvFile('.env.local');
const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
const bucket = 'car-images';
const existing = await fetch(origin + '/storage/v1/bucket/' + bucket, { headers });
if (existing.ok) {
  const config = await existing.json();
  if (config.public !== true) throw new Error('Existing bucket is private; it was left unchanged.');
  console.log('Car image bucket already exists. Existing files and settings unchanged.');
} else {
  const error = await existing.json();
  if (existing.status !== 404 && String(error.statusCode) !== '404') throw new Error('Could not verify existing bucket: HTTP ' + existing.status);
  const created = await fetch(origin + '/storage/v1/bucket', { method: 'POST', headers, body: JSON.stringify({
    id: bucket, name: bucket, public: true, file_size_limit: 4 * 1024 * 1024,
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'],
  }) });
  if (!created.ok) throw new Error('Could not create car image bucket: HTTP ' + created.status);
  console.log('Created public car image bucket (4 MiB, JPG/PNG/WEBP). No files uploaded or deleted; plan unchanged.');
}
