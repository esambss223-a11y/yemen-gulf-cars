import { CarCategory } from '@/types/fleet';

export interface CarPreset {
  make: string;
  model: string;
  year: number;
  category: CarCategory;
  seats: number;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  transmission: 'automatic' | 'manual';
  suggestedDailyEGP: number;
  suggestedWeeklyEGP: number;
  suggestedDepositEGP: number;
  features: string[];
  sampleImages: string[];
}

export const LUXURY_CAR_PRESETS: CarPreset[] = [
  {
    make: 'Mercedes-Benz',
    model: 'S-Class S500 Maybach Kit',
    year: 2024,
    category: 'vip',
    seats: 5,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 8500,
    suggestedWeeklyEGP: 55000,
    suggestedDepositEGP: 15000,
    features: ['مساج مقاعد خلفية', 'شاشات عرض VIP', 'نظام صوتي Burmester 3D', 'ثلاجة خلفية', 'سقف بانوراما مزدوج'],
    sampleImages: ['/car-mercedes.jpg', '/car-mercedes.jpg', '/car-mercedes.jpg']
  },
  {
    make: 'Mercedes-Benz',
    model: 'G-Class G63 AMG',
    year: 2024,
    category: 'suv',
    seats: 5,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 14000,
    suggestedWeeklyEGP: 90000,
    suggestedDepositEGP: 25000,
    features: ['محرك V8 Bi-Turbo', 'عادم رياضي AMG', 'نظام دفع رباعي فائق', 'كاميرات 360 درجة', 'مقاعد جلد نابا'],
    sampleImages: ['/car-rangerover.jpg', '/car-rangerover.jpg']
  },
  {
    make: 'Mercedes-Benz',
    model: 'E-Class E200 AMG Line',
    year: 2024,
    category: 'luxury_sedan',
    seats: 5,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 4500,
    suggestedWeeklyEGP: 28000,
    suggestedDepositEGP: 10000,
    features: ['شاشة MBUX فائقة', 'إضاءة محيطية 64 لون', 'فتحة سقف', 'مساعد القيادة الذاتي'],
    sampleImages: ['/car-mercedes.jpg']
  },
  {
    make: 'Range Rover',
    model: 'Autobiography LWB',
    year: 2024,
    category: 'suv',
    seats: 5,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 12000,
    suggestedWeeklyEGP: 78000,
    suggestedDepositEGP: 20000,
    features: ['أبواب شفط إلكترونية', 'نظام تعليق هوائي نشط', 'شاشات ترفيه خلفية', 'مقاعد Executive Class'],
    sampleImages: ['/car-rangerover.jpg', '/car-rangerover.jpg']
  },
  {
    make: 'Range Rover',
    model: 'Sport Dynamic HSE',
    year: 2024,
    category: 'suv',
    seats: 5,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 9500,
    suggestedWeeklyEGP: 62000,
    suggestedDepositEGP: 18000,
    features: ['جنوط 22 رياضية', 'نظام عزل صوتي متطور', 'توجيه خلفي للعجلات', 'شاشة Meridian ثلاثية الأبعاد'],
    sampleImages: ['/car-rangerover.jpg']
  },
  {
    make: 'BMW',
    model: '7-Series 735i M-Sport',
    year: 2024,
    category: 'vip',
    seats: 5,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 7500,
    suggestedWeeklyEGP: 50000,
    suggestedDepositEGP: 15000,
    features: ['شاشة مسرح خلفية 31 بوصة 8K', 'أبواب أوتوماتيكية بالكامل', 'إضاءة كريستال Iconic Glow', 'مقاعد استرخاء'],
    sampleImages: ['/car-mercedes.jpg', '/car-mercedes.jpg']
  },
  {
    make: 'BMW',
    model: 'X7 xDrive40i M-Sport',
    year: 2024,
    category: 'suv',
    seats: 7,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 9000,
    suggestedWeeklyEGP: 58000,
    suggestedDepositEGP: 18000,
    features: ['7 مقاعد كاملة الراحة', 'سقف Sky Lounge بإضاءة ليلية', 'نظام القيادة الاحترافية', 'تكييف خماسي المناطق'],
    sampleImages: ['/car-rangerover.jpg']
  },
  {
    make: 'Porsche',
    model: 'Panamera 4 E-Hybrid',
    year: 2024,
    category: 'vip',
    seats: 4,
    fuelType: 'hybrid',
    transmission: 'automatic',
    suggestedDailyEGP: 9500,
    suggestedWeeklyEGP: 63000,
    suggestedDepositEGP: 20000,
    features: ['حزمة Sport Chrono', 'تعليق هوائي متكيف', 'سبويلر خلفي متكيف', 'نظام صوتي Bose'],
    sampleImages: ['/car-mercedes.jpg']
  },
  {
    make: 'Porsche',
    model: 'Cayenne GTS Coupe',
    year: 2024,
    category: 'suv',
    seats: 5,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 11000,
    suggestedWeeklyEGP: 72000,
    suggestedDepositEGP: 20000,
    features: ['محرك V8 جبار', 'سقف كربون خفيف الوزن', 'عادم رياضي أسود', 'مقاعد رياضية GTS'],
    sampleImages: ['/car-rangerover.jpg']
  },
  {
    make: 'Toyota',
    model: 'Land Cruiser LC300 GR-Sport',
    year: 2024,
    category: 'suv',
    seats: 7,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 5500,
    suggestedWeeklyEGP: 38000,
    suggestedDepositEGP: 10000,
    features: ['حزمة الطرق الوعرة GR', 'نظام E-KDSS الإلكتروني', 'تبريد وتدفئة المقاعد', 'شاشة ملاحة 12.3 بوصة'],
    sampleImages: ['/car-nissan.jpg', '/car-nissan.jpg']
  },
  {
    make: 'Cadillac',
    model: 'Escalade Platinum Sport',
    year: 2024,
    category: 'vip',
    seats: 7,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 10500,
    suggestedWeeklyEGP: 68000,
    suggestedDepositEGP: 20000,
    features: ['شاشة OLED منحنية 38 بوصة', 'نظام صوتي AKG مع 36 سماعة', 'رؤية ليلية Night Vision', 'مقاعد تدليك'],
    sampleImages: ['/car-rangerover.jpg']
  },
  {
    make: 'Nissan',
    model: 'Patrol Platinum V8',
    year: 2024,
    category: 'suv',
    seats: 7,
    fuelType: 'petrol',
    transmission: 'automatic',
    suggestedDailyEGP: 6500,
    suggestedWeeklyEGP: 42000,
    suggestedDepositEGP: 10000,
    features: ['بطل الدروب V8', 'جلد نابا مبطن بالماس', 'ثلاجة تبريد مركزية', 'شاشات خلفية مزدوجة'],
    sampleImages: ['/car-nissan.jpg', '/car-nissan.jpg']
  }
];
