// Readiness probe only: a nonexistent actor makes the RPC reject before any write.
process.loadEnvFile('.env.local');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/fleet_car_action`, {
  method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_actor: '00000000-0000-0000-0000-000000000000', p_car_id: '__readiness_probe__', p_action: '__probe__' }),
  signal: AbortSignal.timeout(15000),
});
const error = await response.json();
if (error?.message?.includes('ADMIN_REQUIRED')) {
  console.log('Car lifecycle database functions installed. Probe made no changes.');
} else {
  console.log(error?.code === 'PGRST202' ? 'Car lifecycle migration still needs installation.' : `Could not verify installation (${error?.code || 'UNKNOWN'}).`);
  process.exitCode = 1;
}
