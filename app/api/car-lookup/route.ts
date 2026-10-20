import { NextRequest, NextResponse } from 'next/server';

// قاموس ترجمة وتصحيح الماركات والموديلات الشهيرة بين العربي والإنجليزي
const BRAND_AR_EN_MAP: Record<string, string> = {
  // الماركات الصينية
  'بي واي دي': 'BYD',
  'بيواي دي': 'BYD',
  'جيلي': 'Geely',
  'شيري': 'Chery',
  'شانجان': 'Changan',
  'هافال': 'Haval',
  'تانك': 'Tank',
  'هونشي': 'Hongqi',
  'هونغتشي': 'Hongqi',
  'زيكر': 'Zeekr',
  'جيتور': 'Jetour',
  'لينك اند كو': 'Lynk & Co',
  'لينك أند كو': 'Lynk & Co',
  'بايك': 'BAIC',
  'جي اي سي': 'GAC',
  'جاك': 'JAC',
  'اكسيد': 'Exeed',
  'إكسيد': 'Exeed',
  'ام جي': 'MG',
  'إم جي': 'MG',
  'نيو': 'NIO',
  'اكس بنغ': 'XPeng',
  'فوياه': 'Voyah',
  'افاتار': 'Avatr',

  // مرسيدس وموديلاتها
  'مرسيدس بنز': 'Mercedes-Benz',
  'مرسيدس': 'Mercedes-Benz',
  'اس كلاس': 'S-Class',
  'اي كلاس': 'E-Class',
  'سي كلاس': 'C-Class',
  'جي كلاس': 'G-Class',
  'مايباخ': 'Maybach',
  'جي 63': 'G63 AMG',
  'اس 500': 'S500',
  'اي 200': 'E200',

  // بي ام دبليو
  'بي ام دبليو': 'BMW',
  'بي ام': 'BMW',
  'الفئة السابعة': '7 Series',
  'الفئة الخامسة': '5 Series',
  'الفئة الثالثة': '3 Series',

  // لاند روفر ورنج روفر
  'رنج روفر سبورت': 'Range Rover Sport',
  'رنج روفر فوج': 'Range Rover Vogue',
  'رنج روفر': 'Range Rover',
  'لاند روفر': 'Land Rover',
  'ديفندر': 'Land Rover Defender',
  'فيلار': 'Range Rover Velar',
  'ايفوك': 'Range Rover Evoque',

  // بورش
  'بورش كايين': 'Porsche Cayenne',
  'بورشه كايين': 'Porsche Cayenne',
  'بورش باناميرا': 'Porsche Panamera',
  'بورش': 'Porsche',
  'بورشه': 'Porsche',
  'كايين': 'Porsche Cayenne',
  'باناميرا': 'Porsche Panamera',

  // لكزس
  'لكزس': 'Lexus',

  // تويوتا
  'تويوتا لاند كروزر': 'Toyota Land Cruiser',
  'تويوتا لاندكروزر': 'Toyota Land Cruiser',
  'لاند كروزر': 'Toyota Land Cruiser',
  'لاندكروزر': 'Toyota Land Cruiser',
  'برادو': 'Toyota Prado',
  'كامري': 'Toyota Camry',
  'كورولا': 'Toyota Corolla',
  'يارس': 'Toyota Yaris',
  'ياريس': 'Toyota Yaris',
  'راف فور': 'Toyota RAV4',
  'فورتشنر': 'Toyota Fortuner',
  'تويوتا': 'Toyota',

  // نيسان
  'نيسان باترول': 'Nissan Patrol',
  'باترول': 'Nissan Patrol',
  'صني': 'Nissan Sunny',
  'قشقاي': 'Nissan Qashqai',
  'اكس تريل': 'Nissan X-Trail',
  'التيما': 'Nissan Altima',
  'نيسان': 'Nissan',

  // كاديلاك وجي ام سي وشيفروليه
  'كاديلاك اسكاليد': 'Cadillac Escalade',
  'اسكاليد': 'Cadillac Escalade',
  'كاديلاك': 'Cadillac',
  'يوكون': 'GMC Yukon',
  'يوكن': 'GMC Yukon',
  'سييرا': 'GMC Sierra',
  'جي ام سي': 'GMC',
  'تاهو': 'Chevrolet Tahoe',
  'سوبربان': 'Chevrolet Suburban',
  'كابتيفا': 'Chevrolet Captiva',
  'شيفروليه': 'Chevrolet',
  'شفروليه': 'Chevrolet',

  // هيونداي
  'هيونداي النترا': 'Hyundai Elantra',
  'النترا': 'Hyundai Elantra',
  'سوناتا': 'Hyundai Sonata',
  'توسان': 'Hyundai Tucson',
  'اكسنت': 'Hyundai Accent',
  'سنتافي': 'Hyundai Santa Fe',
  'هيونداي': 'Hyundai',

  // كيا
  'كيا سبورتاج': 'Kia Sportage',
  'سبورتاج': 'Kia Sportage',
  'سيراتو': 'Kia Cerato',
  'كارينز': 'Kia Carens',
  'سورينتو': 'Kia Sorento',
  'كي 5': 'Kia K5',
  'كيا': 'Kia',

  // فورد وأودي وفولكس واجن وغيرها
  'اودي': 'Audi',
  'أودي': 'Audi',
  'فورد اكسبلورر': 'Ford Explorer',
  'فورد تورس': 'Ford Taurus',
  'فورد': 'Ford',
  'بنتلي': 'Bentley',
  'رولز رويس': 'Rolls-Royce',
  'جينيسيس': 'Genesis',
  'طوارق': 'Volkswagen Touareg',
  'تيجوان': 'Volkswagen Tiguan',
  'فولكس واجن': 'Volkswagen',
  'فولكس فاجن': 'Volkswagen',
  'ميتسوبيشي': 'Mitsubishi',
  'مازدا': 'Mazda',
  'هوندا': 'Honda',
  'سوزوكي': 'Suzuki',
};

// ترجمة الألوان من العربية للإنجليزية للبحث الدقيق في صور السيارات
const COLOR_AR_EN_MAP: Record<string, string> = {
  'أبيض': 'white',
  'أبيض لؤلؤي': 'white',
  'لؤلؤي': 'white',
  'ابيض': 'white',
  'white': 'white',
  'أسود': 'black',
  'أسود ملكي': 'black',
  'اسود': 'black',
  'black': 'black',
  'رمادي': 'gray',
  'فضي': 'silver',
  'رمادي تيتانيوم': 'gray',
  'فضي ميتاليك': 'silver',
  'silver': 'silver',
  'gray': 'gray',
  'grey': 'grey',
  'أزرق': 'blue',
  'أزرق ملكي': 'blue',
  'ازرق': 'blue',
  'كحلي': 'navy',
  'blue': 'blue',
  'أحمر': 'red',
  'احمر': 'red',
  'أحمر قرمزي': 'red',
  'نبيتي': 'burgundy',
  'red': 'red',
  'ذهبي': 'gold',
  'شامبين': 'champagne',
  'بيج': 'beige',
  'gold': 'gold',
  'champagne': 'champagne',
  'أخضر': 'green',
  'اخضر': 'green',
  'زيتي': 'dark green',
  'green': 'green',
  'بني': 'brown',
  'برونزي': 'bronze',
  'brown': 'brown',
};

// كلمات الاستبعاد الصارمة لمنع أي نتائج غير سيارات (مدن، بلدان، مطارات، لاعبين، أفلام، إلخ)
const NON_CAR_KEYWORDS = [
  'city', 'town', 'village', 'municipality', 'district', 'province', 'county',
  'region', 'prefecture', 'airport', 'station', 'railway', 'subway', 'politician',
  'minister', 'actor', 'actress', 'football', 'basketball', 'cricket', 'club',
  'league', 'song', 'album', 'band', 'singer', 'film', 'television', 'tv series',
  'novel', 'book', 'river', 'lake', 'mountain', 'island', 'university', 'school',
  'hospital', 'disambiguation', 'corporation', 'holding company', 'conglomerate'
];

// الكلمات التأكيدية للسيارات والمركبات
const CAR_AFFIRMATION_KEYWORDS = [
  'car', 'automobile', 'vehicle', 'suv', 'sedan', 'crossover', 'hatchback',
  'coupe', 'wagon', 'convertible', 'pickup', 'truck', 'electric', 'hybrid',
  'phev', 'ev', 'motor', 'chassis', 'van', 'minivan', 'roadster', 'sports car',
  'saloon', 'compact', 'fastback', 'c-segment', 'b-segment', 'd-segment', 'e-segment'
];

// قائمة الماركات المعروفة لاعتمادها فوراً
const KNOWN_MAKES = [
  'byd', 'geely', 'chery', 'changan', 'haval', 'tank', 'hongqi', 'zeekr', 'jetour',
  'lynk & co', 'baic', 'gac', 'jac', 'exeed', 'mg', 'toyota', 'mercedes', 'bmw',
  'audi', 'lexus', 'porsche', 'cadillac', 'gmc', 'chevrolet', 'hyundai', 'kia',
  'nissan', 'land rover', 'range rover', 'ford', 'bentley', 'rolls-royce',
  'genesis', 'volkswagen', 'mitsubishi', 'mazda', 'honda', 'suzuki', 'nio', 'xpeng'
];

// دالة فحص ما إذا كانت النتيجة سيارة حقيقية
function isStrictlyCar(title: string, description: string = ''): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // 1. استبعاد صريح إذا كان الوصف يشير لمدينة أو مطار أو كيان غير سيارات
  for (const bad of NON_CAR_KEYWORDS) {
    if (lowerDesc.includes(bad)) {
      return false;
    }
  }

  // 2. فحص العنوان للاستبعادات
  if (
    lowerTitle.includes('(disambiguation)') ||
    lowerTitle.includes('list of') ||
    lowerTitle.includes('template:') ||
    lowerTitle.includes('category:')
  ) {
    return false;
  }

  // 3. تأكيد إيجابي من الوصف
  for (const good of CAR_AFFIRMATION_KEYWORDS) {
    if (lowerDesc.includes(good)) {
      return true;
    }
  }

  // 4. تأكيد إيجابي من العنوان
  for (const make of KNOWN_MAKES) {
    if (lowerTitle.startsWith(make) || lowerTitle.includes(make)) {
      // التأكد من عدم وجود كلمات استبعاد في العنوان
      if (!NON_CAR_KEYWORDS.some(kw => lowerTitle.includes(kw))) {
        return true;
      }
    }
  }

  return false;
}

// دالة استخراج الماركة والموديل بدقة
function parseMakeAndModel(cleanName: string): { make: string; model: string } {
  const multiWordMakes = [
    'Mercedes-Benz', 'Land Rover', 'Range Rover', 'Lynk & Co', 
    'Rolls-Royce', 'Aston Martin', 'Alfa Romeo'
  ];

  for (const mwm of multiWordMakes) {
    if (cleanName.toLowerCase().startsWith(mwm.toLowerCase())) {
      const rest = cleanName.slice(mwm.length).trim();
      return { make: mwm, model: rest || mwm };
    }
  }

  const parts = cleanName.split(/\s+/);
  const make = parts[0] || 'Car';
  const model = parts.slice(1).join(' ') || '';
  return { make, model };
}

// وظيفة تحديد الفئة التلقائية والأسعار والمواصفات
function detectCarSpecs(normalizedQuery: string, description: string = '') {
  const lower = (normalizedQuery + ' ' + description).toLowerCase();
  
  let category: 'vip' | 'suv' | 'luxury_sedan' | 'economy' = 'economy';
  let seats = 5;
  let suggestedDailyEGP = 2500;
  let suggestedDepositEGP = 5000;
  let fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid' = 'petrol';
  let features = ['مكيف هواء قوي', 'شاشة لمس ذكية', 'بلوتوث وUSB', 'حساسات ركن خلفية'];

  // كشف السيارات الكهربائية والهجينة
  if (
    lower.includes('electric') ||
    lower.includes('ev') ||
    lower.includes('atto') ||
    lower.includes('dolphin') ||
    lower.includes('seagull') ||
    lower.includes('zeekr') ||
    lower.includes('seal') ||
    lower.includes('nio') ||
    lower.includes('xpeng')
  ) {
    fuelType = 'electric';
  } else if (
    lower.includes('hybrid') ||
    lower.includes('dm-i') ||
    lower.includes('song plus') ||
    lower.includes('phev')
  ) {
    fuelType = 'hybrid';
  }

  // كشف الفئة والأسعار
  if (
    lower.includes('maybach') ||
    lower.includes('s-class') ||
    lower.includes('s500') ||
    lower.includes('s580') ||
    lower.includes('7 series') ||
    lower.includes('735') ||
    lower.includes('740') ||
    lower.includes('750') ||
    lower.includes('760') ||
    lower.includes('a8') ||
    lower.includes('rolls') ||
    lower.includes('bentley') ||
    lower.includes('cullinan') ||
    lower.includes('phantom') ||
    lower.includes('ghost') ||
    lower.includes('flying spur') ||
    lower.includes('hongqi h9') ||
    lower.includes('hongqi e-hs9') ||
    lower.includes('zeekr 009')
  ) {
    category = 'vip';
    suggestedDailyEGP = 8500;
    suggestedDepositEGP = 20000;
    features = ['مقاعد جلد فاخر مع مساج', 'شاشات خلفية VIP', 'سقف بانورامي مزدوج', 'نظام صوتي محيطي 3D', 'ثلاجة مشروبات خلفية', 'ستائر كهربائية جانبية'];
  } else if (
    lower.includes('patrol') ||
    lower.includes('land cruiser') ||
    lower.includes('prado') ||
    lower.includes('tahoe') ||
    lower.includes('escalade') ||
    lower.includes('range rover') ||
    lower.includes('defender') ||
    lower.includes('g-class') ||
    lower.includes('g63') ||
    lower.includes('x7') ||
    lower.includes('x5') ||
    lower.includes('q7') ||
    lower.includes('q8') ||
    lower.includes('cayenne') ||
    lower.includes('lx') ||
    lower.includes('tucson') ||
    lower.includes('sportage') ||
    lower.includes('suv') ||
    lower.includes('crossover') ||
    lower.includes('monjaro') ||
    lower.includes('tiggo') ||
    lower.includes('cs95') ||
    lower.includes('cs85') ||
    lower.includes('cs75') ||
    lower.includes('uni-k') ||
    lower.includes('tank 300') ||
    lower.includes('tank 500') ||
    lower.includes('haval') ||
    lower.includes('dashing') ||
    lower.includes('t2') ||
    lower.includes('gs8') ||
    lower.includes('tang') ||
    lower.includes('song plus') ||
    lower.includes('voyah free')
  ) {
    category = 'suv';
    seats = (
      lower.includes('cruiser') || 
      lower.includes('patrol') || 
      lower.includes('tahoe') || 
      lower.includes('escalade') || 
      lower.includes('prado') || 
      lower.includes('x7') ||
      lower.includes('tiggo 8') ||
      lower.includes('cs95') ||
      lower.includes('tang') ||
      lower.includes('tank 500') ||
      lower.includes('gs8')
    ) ? 7 : 5;
    suggestedDailyEGP = (lower.includes('patrol') || lower.includes('land cruiser') || lower.includes('escalade') || lower.includes('range') || lower.includes('g63')) ? 7000 : 3800;
    suggestedDepositEGP = Math.round(suggestedDailyEGP * 2.5);
    features = ['دفع رباعي 4x4 فائق', 'كاميرات 360 درجة مع رؤية بانورامية', 'سقف بانوراما', 'مقاعد جلد تبريد وتسخين', 'نظام ملاحة GPS حديث', 'صندوق أمتعة كهربائي واسع'];
  } else if (
    lower.includes('e-class') ||
    lower.includes('e200') ||
    lower.includes('5 series') ||
    lower.includes('520') ||
    lower.includes('a6') ||
    lower.includes('genesis') ||
    lower.includes('g80') ||
    lower.includes('panamera') ||
    lower.includes('es350') ||
    lower.includes('byd han') ||
    lower.includes('byd seal') ||
    lower.includes('zeekr 001') ||
    lower.includes('arrizo 8')
  ) {
    category = 'luxury_sedan';
    suggestedDailyEGP = 4500;
    suggestedDepositEGP = 10000;
    features = ['إضاءة محيطية فاخرة', 'مقاعد جلد ناعم بتحكم كهربائي', 'مثبت سرعة ذكي', 'مساعد القيادة وتحديد المسار', 'نظام صوتي فائق النقاء'];
  } else {
    category = 'economy';
    suggestedDailyEGP = 2000;
    suggestedDepositEGP = 5000;
    features = ['مكيف هواء أوتوماتيكي فائق البرودة', 'شاشة تدعم Apple CarPlay و Android Auto', 'اقتصادية جداً في استهلاك الوقود', 'نظام فرامل ABS ووسائد أمان'];
  }

  const { make, model } = parseMakeAndModel(normalizedQuery);

  return {
    make,
    model,
    year: new Date().getFullYear(),
    category,
    seats,
    fuelType,
    transmission: 'automatic' as const,
    suggestedDailyEGP,
    suggestedWeeklyEGP: suggestedDailyEGP * 6,
    suggestedDepositEGP,
    features,
  };
}

const BLOCKED_IMAGE_WORDS = [
  'building', 'headquarters', 'hq', 'factory', 'plant', 'assembly', 'entrance',
  'circuit', 'track', 'booth', 'stage', 'hall', 'stand', 'museum', 'expo',
  'fair', 'conference', 'presentation', 'speech', 'press', 'flag', 'map',
  'diagram', 'chart', 'blueprint', 'scheme', 'portrait', 'person', 'people',
  'man', 'woman', 'founder', 'ceo', 'director', 'worker', 'team',
  'interior_light', 'steering', 'wheel', 'engine', 'motor', 'chassis', 'key',
  'dashboard', 'seat', 'badge', 'emblem', 'logo', 'icon', 'symbol', 'signature',
  'license', 'plate', 'aerial', 'skyline', 'street', 'road', 'traffic', 'crossroad',
  'book', 'journal', 'dictionary', 'newspaper', 'magazine', 'document', 'page',
  'text', 'letter', 'scan', 'archive', 'etymological', 'volume', 'issue', 'djvu', 'pdf'
];

function isCleanCarPhoto(title: string, imgUrl: string, expectedKeywords: string[] = []): boolean {
  if (!imgUrl) return false;
  const lowerTitle = title.toLowerCase();
  const lowerUrl = imgUrl.toLowerCase();

  // رفض الصيغ غير المناسبة والمستندات والكتب
  if (
    lowerUrl.endsWith('.svg') || 
    lowerUrl.endsWith('.png') || 
    lowerUrl.endsWith('.gif') ||
    lowerUrl.includes('.pdf') ||
    lowerUrl.includes('.djvu') ||
    lowerUrl.includes('.tif') ||
    lowerTitle.includes('.pdf') ||
    lowerTitle.includes('.djvu')
  ) {
    return false;
  }

  // رفض أي صورة تحوي كلمات محظورة
  for (const word of BLOCKED_IMAGE_WORDS) {
    if (lowerTitle.includes(word) || lowerUrl.includes(word)) {
      return false;
    }
  }

  // التحقق من وجود كلمة مفتاحية تشير لسيارة أو الموديل المطلوب
  if (expectedKeywords.length > 0) {
    const hasExpected = expectedKeywords.some(kw => kw.length > 2 && lowerTitle.includes(kw.toLowerCase()));
    if (!hasExpected) {
      return false;
    }
  }

  return true;
}

// دالة مساعدة لجلب الصور من Wikimedia Commons بنطاق الملفات مع التحقق الصارم من كلمات الموديل
async function fetchCommonsImages(searchTerm: string, limit = 4, expectedKeywords: string[] = []): Promise<string[]> {
  try {
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrnamespace=6&gsrlimit=${limit * 3}&prop=pageimages&pithumbsize=1200`;
    const res = await fetch(commonsUrl, {
      headers: { 'User-Agent': 'YemenGulfLuxuryCars/2.0 (contact@ygcarss.com)' },
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
      const images: string[] = [];

      for (const p of pages as any[]) {
        const title: string = p?.title || '';
        const img: string = p?.thumbnail?.source || '';

        if (isCleanCarPhoto(title, img, expectedKeywords)) {
          images.push(img);
          if (images.length >= limit) break;
        }
      }
      return images;
    }
  } catch (err) {
    console.error('Commons fetch error:', err);
  }
  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('query') || searchParams.get('q') || '';
  const mode = searchParams.get('mode') || 'full'; // 'autocomplete' | 'full'
  const rawColor = searchParams.get('color') || '';
  const rawYear = searchParams.get('year') || '';

  if (!rawQuery.trim()) {
    return NextResponse.json({
      success: true,
      suggestions: [],
      images: [],
    });
  }

  // ترجمة وتطبيع كلمات البحث من العربي إلى الإنجليزي
  let normalizedQuery = rawQuery.trim();
  for (const [ar, en] of Object.entries(BRAND_AR_EN_MAP)) {
    if (normalizedQuery.includes(ar)) {
      normalizedQuery = normalizedQuery.replace(new RegExp(ar, 'g'), en);
    }
  }

  // ترجمة اللون المطلوب إن وجد
  const enColor = COLOR_AR_EN_MAP[rawColor.trim().toLowerCase()] || rawColor.trim();
  const yearStr = rawYear.trim();

  // الكلمات المفتاحية الإلزامية للموديل
  const carKeywords = normalizedQuery.split(/\s+/).filter(w => w.length >= 3);

  // 1. نمط الإكمال التلقائي الحي الفوري مع الفلترة الصارمة للسيارات فقط
  if (mode === 'autocomplete') {
    const liveSuggestions: Array<{ 
      title: string; 
      image?: string; 
      category: string;
      description?: string;
    }> = [];

    try {
      const prefixUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=prefixsearch&gpssearch=${encodeURIComponent(normalizedQuery)}&gpslimit=10&prop=description|pageimages&pithumbsize=300`;
      const res = await fetch(prefixUrl, {
        headers: { 'User-Agent': 'YemenGulfLuxuryCars/2.0 (contact@ygcarss.com)' },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

        for (const p of pages as any[]) {
          const title = p?.title;
          const description = p?.description || '';
          const img = p?.thumbnail?.source;

          if (title && isStrictlyCar(title, description)) {
            const specs = detectCarSpecs(title, description);
            const cleanImg = img && isCleanCarPhoto(title, img) ? img : undefined;
            liveSuggestions.push({
              title,
              image: cleanImg,
              category: specs.category,
              description,
            });
          }
        }
      }
    } catch (err) {
      console.error('Autocomplete API error:', err);
    }

    return NextResponse.json({
      success: true,
      query: rawQuery,
      normalizedQuery,
      suggestions: liveSuggestions,
    });
  }

  // 2. نمط الجلب الشامل للمواصفات والصور بدقة عالية مع مراعاة اللون وسنة الصنع
  const specs = detectCarSpecs(normalizedQuery);
  const foundImages: string[] = [];
  const seenUrls = new Set<string>();

  // أولوية 1: إذا تم تحديد لون وسنة، نبحث بدقة عن (الموديل + اللون + السنة)
  if (enColor && yearStr) {
    const preciseTerm = `${normalizedQuery} ${yearStr} ${enColor} car`;
    const directImages = await fetchCommonsImages(preciseTerm, 4, carKeywords);
    for (const img of directImages) {
      if (!seenUrls.has(img)) {
        seenUrls.add(img);
        foundImages.push(img);
      }
    }
  }

  // أولوية 2: البحث عن (الموديل + اللون)
  if (enColor && foundImages.length < 4) {
    const colorTerm = `${normalizedQuery} ${enColor} car`;
    const colorImages = await fetchCommonsImages(colorTerm, 4, carKeywords);
    for (const img of colorImages) {
      if (!seenUrls.has(img)) {
        seenUrls.add(img);
        foundImages.push(img);
      }
    }
  }

  // أولوية 3: البحث عن (الموديل + سنة الصنع)
  if (yearStr && foundImages.length < 4) {
    const yearTerm = `${normalizedQuery} ${yearStr} car`;
    const yearImages = await fetchCommonsImages(yearTerm, 4, carKeywords);
    for (const img of yearImages) {
      if (!seenUrls.has(img)) {
        seenUrls.add(img);
        foundImages.push(img);
      }
    }
  }

  // أولوية 4: البحث عن الموديل في أرشيف ويكيميديا كومنز للسيارات حصراً
  if (foundImages.length < 4) {
    const generalCarImages = await fetchCommonsImages(`${normalizedQuery} car`, 5, carKeywords);
    for (const img of generalCarImages) {
      if (!seenUrls.has(img)) {
        seenUrls.add(img);
        foundImages.push(img);
      }
    }
  }

  return NextResponse.json({
    success: true,
    query: rawQuery,
    normalizedQuery,
    matchedColor: enColor || null,
    matchedYear: yearStr || null,
    specs: {
      ...specs,
      year: yearStr ? parseInt(yearStr, 10) : specs.year,
    },
    images: foundImages.slice(0, 10),
  });
}
