import fs from 'fs';
import path from 'path';

process.loadEnvFile('.env.local');

const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!origin || !key) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const bucket = 'car-images';
const localDir = path.join(process.cwd(), 'public', 'cars', 'jac');
const files = ['1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg', '6.jpeg', '7.jpeg', '8.jpeg'];

async function uploadImages() {
  console.log('Uploading images to Supabase Storage...');
  const uploadedUrls = [];

  for (const file of files) {
    const filePath = path.join(localDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `jac/${file}`;

    const uploadRes = await fetch(`${origin}/storage/v1/object/${bucket}/${storagePath}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
      },
      body: fileBuffer,
    });

    if (uploadRes.ok) {
      const publicUrl = `${origin}/storage/v1/object/public/${bucket}/${storagePath}`;
      console.log(`Uploaded ${file} -> ${publicUrl}`);
      uploadedUrls.push(publicUrl);
    } else {
      const err = await uploadRes.text();
      console.warn(`Failed to upload ${file} to storage (${err}), falling back to local path`);
      uploadedUrls.push(`/cars/jac/${file}`);
    }
  }

  return uploadedUrls;
}

async function ensureCompanyOwner() {
  const ownerData = {
    id: 'owner-1',
    name: 'شركة يمن الخليج (أسطول الشركة)',
    phone: '+20 100 123 4567',
    commission_model: 'fixed_monthly',
    owner_share_percent: 100,
    monthly_payout_day: 1,
    notes: 'الأسطول الأساسي المملوك للشركة',
  };

  const res = await fetch(`${origin}/rest/v1/owners`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(ownerData),
  });

  if (!res.ok) {
    console.warn('Could not insert owner-1:', await res.text());
  } else {
    console.log('Company owner (owner-1) verified.');
  }
}

async function insertCar(imageUrls) {
  console.log('Inserting JAC car into public.cars...');

  const carData = {
    id: 'car-jac-top-01',
    car_code: 'YG-001',
    make: 'جاك',
    model: 'JS4 أعلى فئة (فل كامل)',
    year: 2025,
    category: 'suv',
    plate_number: 'أ ب ج 1234',
    vin: 'JAC2025JS4TOP01',
    color: 'رمادي ميتاليك فاخر',
    current_km: 15000,
    initial_handover_km: 10000,
    daily_price_egp: 1500,
    weekly_price_egp: 9000,
    monthly_price_egp: 32000,
    security_deposit_egp: 5000,
    status: 'available',
    cover_image: imageUrls[0] || '/cars/jac/1.jpeg',
    images: imageUrls,
    transmission: 'automatic',
    fuel_type: 'petrol',
    seats: 5,
    ownership: 'company',
    owner_id: 'owner-1',
    owner_name: 'شركة يمن الخليج (أسطول الشركة)',
    features: [
      'أعلى فئة فل كامل',
      'فتحة سقف بانوراما كاملة',
      'كراسي كهرباء تحكم كامل',
      'حساسات ركن كاملة أمامي وخلفي',
      'كاميرات محيطية 360 درجة',
      'شاشة ترفيه ذكية كاملة',
      'دخول ذكي وبصمة تشغيل',
      'مثبت سرعة وتحكم بالطارة'
    ],
  };

  const insertRes = await fetch(`${origin}/rest/v1/cars`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(carData),
  });

  if (!insertRes.ok) {
    const errorText = await insertRes.text();
    throw new Error(`Failed to insert car: ${insertRes.status} ${errorText}`);
  }

  const result = await insertRes.json();
  console.log('Successfully inserted JAC car:', result);
}

async function main() {
  try {
    const imageUrls = await uploadImages();
    await ensureCompanyOwner();
    await insertCar(imageUrls);
    console.log('DONE! Car successfully uploaded and recorded in database.');
  } catch (err) {
    console.error('Error during execution:', err);
    process.exit(1);
  }
}

main();
