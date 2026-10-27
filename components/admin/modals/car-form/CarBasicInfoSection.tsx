'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Car as CarIcon, RefreshCw, Search, Loader2, Check, ChevronDown } from 'lucide-react';
import { CarFormState } from '../CarFormModal';

interface CarBasicInfoSectionProps {
  carForm: CarFormState;
  setCarForm: React.Dispatch<React.SetStateAction<CarFormState>>;
  onGenerateCode: () => void;
  onSelectCarPreset?: (specs: any, images: string[]) => void;
}

const POPULAR_CAR_PRESETS = [
  'Mercedes S-Class',
  'Range Rover',
  'Nissan Patrol',
  'BYD Song Plus',
  'Toyota Land Cruiser',
  'Porsche Cayenne',
];

export default function CarBasicInfoSection({
  carForm,
  setCarForm,
  onGenerateCode,
  onSelectCarPreset,
}: CarBasicInfoSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ title: string; category: string; image?: string; description?: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // إغلاق القائمة عند النقر بالخارج
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // البحث التلقائي الفوري مع Debounce
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim() || val.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/car-lookup?query=${encodeURIComponent(val.trim())}&mode=autocomplete`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowDropdown((data.suggestions || []).length > 0);
        }
      } catch (err) {
        console.error('Car autocomplete error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // تطبيق اختيار سيارة معينة وجلب مواصفاتها وصورها الرسمية
  const handleApplyPreset = async (carName: string) => {
    setIsSearching(true);
    setShowDropdown(false);
    setSearchQuery(carName);

    try {
      const res = await fetch(
        `/api/car-lookup?query=${encodeURIComponent(carName)}&mode=full&color=${encodeURIComponent(carForm.color || '')}&year=${carForm.year || ''}`
      );
      if (res.ok) {
        const data = await res.json();
        const specs = data.specs || {};
        const images: string[] = data.images || [];

        // تحديث استمارة السيارة بالبيانات المكتشفة
        setCarForm((prev) => ({
          ...prev,
          make: specs.make || prev.make,
          model: specs.model || prev.model,
          year: specs.year || prev.year,
          category: specs.category || prev.category,
          transmission: specs.transmission || prev.transmission,
          fuelType: specs.fuelType || prev.fuelType,
          seats: specs.seats || prev.seats,
          dailyPriceEGP: prev.dailyPriceEGP === 5000 && specs.suggestedDailyEGP ? specs.suggestedDailyEGP : prev.dailyPriceEGP,
          weeklyPriceEGP: prev.weeklyPriceEGP === 32000 && specs.suggestedWeeklyEGP ? specs.suggestedWeeklyEGP : prev.weeklyPriceEGP,
          securityDepositEGP: prev.securityDepositEGP === 10000 && specs.suggestedDepositEGP ? specs.suggestedDepositEGP : prev.securityDepositEGP,
          features: specs.features && specs.features.length > 0 ? specs.features : prev.features,
          // إذا كانت الصور الحالية افتراضية فقط، نضع صور الكتالوج المسترجعة
          images:
            images.length > 0 && (prev.images.length === 0 || prev.images[0] === '/car-mercedes.jpg')
              ? images.slice(0, 4)
              : prev.images,
        }));

        if (onSelectCarPreset) {
          onSelectCarPreset(specs, images);
        }

        setAutoFillSuccess(`تم جلب مواصفات وصور ${specs.make} ${specs.model} بنجاح!`);
        setTimeout(() => setAutoFillSuccess(null), 3500);
      }
    } catch (err) {
      console.error('Car lookup error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-3.5 bg-[#070d19] border border-slate-800/80 rounded-xl space-y-3 font-arabic">
      
      {/* 1. شريط البحث السريع عن الموديل وجلب المعلومات والصور المقترحة */}
      <div className="p-3 rounded-xl bg-[#0b1324] border border-[#c5a059]/30 space-y-2 relative" ref={dropdownRef}>
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#c5a059]" />
            البحث السريع وجلب مواصفات وصور الموديل تلقائياً:
          </label>
          <span className="text-[10px] text-slate-400">
            اكتب اسم الموديل بالعربي أو الإنجليزي
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="مثلاً: مرسيدس S500، رنج روفر، BYD Song Plus، لاند كروزر، بورش..."
            className="w-full bg-[#060b16] border border-slate-700/80 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#c5a059] pr-3 pl-9 transition-colors font-arabic"
          />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-[#c5a059]" /> : <Search className="w-4 h-4 text-slate-500" />}
          </div>

          {/* قائمة الاقتراحات المنسدلة الذكية */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0b1426] border border-[#c5a059]/40 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-800">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(item.title)}
                  className="w-full px-3 py-2.5 text-right hover:bg-[#121f38] transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                        ({item.description})
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-[#c5a059] font-mono shrink-0">
                    {item.category.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* أزرار سريعة لأشهر سيارات الأسطول بنقرة واحدة */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-400">مقترحات سريعة:</span>
          {POPULAR_CAR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-[#c5a059]/20 hover:text-amber-300 text-slate-300 text-[10px] transition-all cursor-pointer border border-slate-700/60"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* رسالة نجاح التعبئة التلقائية */}
        {autoFillSuccess && (
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{autoFillSuccess}</span>
          </div>
        )}
      </div>

      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 pt-1">
        <CarIcon className="w-3.5 h-3.5 text-[#c5a059]" /> بيانات المركبة وكود الأصل والعداد:
      </span>

      {/* كود العربية وتاريخ الدخول وعداد الاستلام من المالك */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[#c5a059] font-bold text-[10px]">كود العربية (Car Code):</label>
            <button
              type="button"
              onClick={onGenerateCode}
              className="text-[9px] text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer"
              title="توليد كود تلقائي"
            >
              <RefreshCw className="w-2.5 h-2.5" /> كود تلقائي
            </button>
          </div>
          <input
            type="text"
            value={carForm.carCode || ''}
            onChange={(e) => setCarForm({ ...carForm, carCode: e.target.value })}
            placeholder="مثال: YG-001 أو VIP-S500"
            className="w-full bg-[#0b1322] border border-[#c5a059]/60 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">عداد الاستلام من المالك (KM):</label>
          <input
            type="number"
            min="0"
            value={carForm.initialHandoverKm ?? 0}
            onChange={(e) => setCarForm({ ...carForm, initialHandoverKm: parseInt(e.target.value) || 0 })}
            placeholder="العداد وقت دخول الأسطول"
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">تاريخ دخول الأسطول:</label>
          <input
            type="date"
            value={carForm.fleetEntryDate || ''}
            onChange={(e) => setCarForm({ ...carForm, fleetEntryDate: e.target.value })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div>
          <label className="block text-slate-400 text-[10px] mb-1">الماركة (Make):</label>
          <input
            type="text"
            required
            value={carForm.make}
            onChange={(e) => setCarForm({ ...carForm, make: e.target.value })}
            placeholder="Mercedes, BYD, Toyota"
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">الموديل (Model):</label>
          <input
            type="text"
            required
            value={carForm.model}
            onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
            placeholder="S-Class, Song Plus, Patrol"
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">سنة الصنع (Year):</label>
          <input
            type="number"
            min="1990"
            max="2030"
            value={carForm.year}
            onChange={(e) => setCarForm({ ...carForm, year: parseInt(e.target.value) || 2024 })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">رقم اللوحة المرورية:</label>
          <input
            type="text"
            required
            value={carForm.plateNumber}
            onChange={(e) => setCarForm({ ...carForm, plateNumber: e.target.value })}
            placeholder="مثال: أ ب ج 1234"
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div>
          <label className="block text-slate-400 text-[10px] mb-1">اللون الخارجي:</label>
          <input
            type="text"
            value={carForm.color}
            onChange={(e) => setCarForm({ ...carForm, color: e.target.value })}
            placeholder="أسود ملكي، أبيض لؤلؤي"
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">العداد الحالي (KM):</label>
          <input
            type="number"
            min="0"
            value={carForm.currentKm}
            onChange={(e) => setCarForm({ ...carForm, currentKm: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">فئة السيارة (Category):</label>
          <select
            value={carForm.category}
            onChange={(e) => setCarForm({ ...carForm, category: e.target.value as any })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
          >
            <option value="vip">VIP فاخرة جداً</option>
            <option value="suv">SUV دفع رباعي عائلية</option>
            <option value="luxury_sedan">سيدان فارهة</option>
            <option value="economy">اقتصادية ممتازة</option>
          </select>
        </div>

      </div>

    </div>
  );
}
