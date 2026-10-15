'use client';

import React, { useState } from 'react';
import { Car as CarIcon, X, Sparkles, Upload, Plus, Trash2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { Car, VehicleOwner } from '@/types/fleet';
import { LUXURY_CAR_PRESETS, CarPreset } from '@/lib/car-presets';
import { supabase } from '@/lib/supabase';

export interface CarFormState {
  make: string;
  model: string;
  year: number;
  category: Car['category'];
  plateNumber: string;
  color: string;
  currentKm: number;
  dailyPriceEGP: number;
  weeklyPriceEGP: number;
  securityDepositEGP: number;
  status: Car['status'];
  images: string[];
  transmission: Car['transmission'];
  fuelType: Car['fuelType'];
  seats: number;
  ownership: Car['ownership'];
  ownerId: string;
  ownerName: string;
  features: string[];
}

interface CarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCar: Car | null;
  carForm: CarFormState;
  setCarForm: React.Dispatch<React.SetStateAction<CarFormState>>;
  owners: VehicleOwner[];
  onSubmit: (e: React.FormEvent) => void;
}

export default function CarFormModal({
  isOpen,
  onClose,
  editingCar,
  carForm,
  setCarForm,
  owners,
  onSubmit,
}: CarFormModalProps) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [presetSearch, setPresetSearch] = useState('');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  if (!isOpen) return null;

  // جلب وتطبيق بيانات السيارة المقترحة فوراً
  const applyPreset = (preset: CarPreset) => {
    setCarForm((prev) => ({
      ...prev,
      make: preset.make,
      model: preset.model,
      year: preset.year,
      category: preset.category,
      seats: preset.seats,
      fuelType: preset.fuelType,
      transmission: preset.transmission,
      dailyPriceEGP: preset.suggestedDailyEGP,
      weeklyPriceEGP: preset.suggestedWeeklyEGP,
      securityDepositEGP: preset.suggestedDepositEGP,
      features: preset.features,
      images: preset.sampleImages && preset.sampleImages.length > 0 ? preset.sampleImages : prev.images
    }));
    setShowPresetDropdown(false);
    setPresetSearch(`${preset.make} ${preset.model}`);
  };

  // رفع صورة سحابياً إلى Supabase Storage أو تحويلها لمعاينة
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('جاري رفع الصورة سحابياً...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `car_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
      const filePath = `cars/${fileName}`;

      // محاولة الرفع إلى باكت car-images في Supabase Storage
      const { data, error } = await supabase.storage
        .from('car-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(filePath);

        setCarForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), publicUrl]
        }));
        setUploadMessage('تم رفع الصورة السحابية بنجاح ✓');
      } else {
        // Fallback: استخدام FileReader محلياً إذا لم يكن الـ bucket جاهزاً بعد
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setCarForm((prev) => ({
              ...prev,
              images: [...(prev.images || []), reader.result as string]
            }));
            setUploadMessage('تمت إضافة الصورة بنجاح ✓');
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      setUploadMessage('حدث خطأ أثناء الرفع، تم حفظها محلياً');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMessage(null), 3500);
    }
  };

  // إضافة رابط صورة يدوياً للألبوم
  const addImageByUrl = () => {
    if (!newImageUrl.trim()) return;
    setCarForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), newImageUrl.trim()]
    }));
    setNewImageUrl('');
  };

  // حذف صورة معينة من الألبوم
  const removeImageAt = (index: number) => {
    setCarForm((prev) => ({
      ...prev,
        images: prev.images.filter((_: string, i: number) => i !== index)
    }));
  };

  // فلترة قائمة السيارات المقترحة
  const filteredPresets = LUXURY_CAR_PRESETS.filter(p => 
    `${p.make} ${p.model}`.toLowerCase().includes(presetSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b1324] border border-[#c5a059]/40 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-5 shadow-2xl my-auto">
        
        {/* ترويسة النافذة */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059]">
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingCar ? `تعديل بيانات ${editingCar.make} ${editingCar.model}` : 'إضافة سيارة جديدة للأسطول'}
              </h3>
              <p className="text-[11px] text-slate-400">نظام المواصفات الذكي ومعرض الصور المتعددة</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. نظام الجلب التلقائي لمواصفات وأسعار السيارة (Auto-Complete Specification) */}
        {!editingCar && (
          <div className="p-3.5 bg-gradient-to-r from-[#c5a059]/10 via-[#0e172a] to-[#0e172a] border border-[#c5a059]/30 rounded-xl relative">
            <label className="block text-xs font-bold text-[#f3e5ab] mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#c5a059]" /> 
              <span>الجلب الذكي للمواصفات والأسعار التلقائية:</span>
              <span className="text-[10px] text-slate-400 font-normal">(اختر سيارة ليتم تعبئة كل شيء بدقة فوراً)</span>
            </label>
            
            <div className="relative">
              <input
                type="text"
                value={presetSearch}
                onChange={(e) => {
                  setPresetSearch(e.target.value);
                  setShowPresetDropdown(true);
                }}
                onFocus={() => setShowPresetDropdown(true)}
                placeholder="ابحث عن موديل (مثال: Mercedes S500, Range Rover, BMW 735, Land Cruiser)..."
                className="w-full bg-[#080d19] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059]"
              />

              {showPresetDropdown && filteredPresets.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#080d19] border border-[#c5a059]/40 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-30 divide-y divide-slate-800">
                  {filteredPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="w-full p-2.5 text-right hover:bg-[#c5a059]/15 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                    >
                      <div>
                        <div className="font-bold text-white group-hover:text-[#c5a059]">{preset.make} {preset.model} ({preset.year})</div>
                        <div className="text-[10px] text-slate-400">
                          فئة: {preset.category === 'vip' ? 'سيدان VIP' : 'دفع رباعي SUV'} • مقاعد: {preset.seats} • وقود: {preset.fuelType}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#c5a059] font-bold">
                        {preset.suggestedDailyEGP.toLocaleString()} ج.م/يوم ←
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          
          {/* 2. بيانات السيارة الأساسية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">ماركة السيارة (Make):</label>
              <input
                type="text"
                required
                value={carForm.make}
                onChange={(e) => setCarForm({ ...carForm, make: e.target.value })}
                placeholder="Mercedes-Benz, BMW, Porsche"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">الموديل (Model):</label>
              <input
                type="text"
                required
                value={carForm.model}
                onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                placeholder="S-Class S500, Range Rover"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">سنة الصنع:</label>
              <input
                type="number"
                value={carForm.year}
                onChange={(e) => setCarForm({ ...carForm, year: parseInt(e.target.value) || 2024 })}
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">رقم اللوحة:</label>
              <input
                type="text"
                required
                value={carForm.plateNumber}
                onChange={(e) => setCarForm({ ...carForm, plateNumber: e.target.value })}
                placeholder="مثال: م ص ر 5542"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-[#c5a059] font-bold mb-1">عداد الكيلومترات الفعلي (Km):</label>
              <input
                type="number"
                required
                value={carForm.currentKm}
                onChange={(e) => setCarForm({ ...carForm, currentKm: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">حالة السيارة:</label>
              <select
                value={carForm.status}
                onChange={(e) => setCarForm({ ...carForm, status: e.target.value as Car['status'] })}
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              >
                <option value="available">🟢 متاحة للتأجير</option>
                <option value="rented">🟡 مؤجرة حالياً</option>
                <option value="maintenance">🔴 في الصيانة</option>
                <option value="cleaning">⚪ تحت التجهيز والغسيل</option>
              </select>
            </div>

            <div>
              <label className="block text-[#c5a059] font-bold mb-1">سعر الإيجار اليومي (ج.م EGP):</label>
              <input
                type="number"
                required
                value={carForm.dailyPriceEGP}
                onChange={(e) => setCarForm({ ...carForm, dailyPriceEGP: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0e172a] border border-[#c5a059]/60 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-cyan-300 font-bold mb-1">مبلغ التأمين المسترد (ج.م EGP):</label>
              <input
                type="number"
                required
                value={carForm.securityDepositEGP}
                onChange={(e) => setCarForm({ ...carForm, securityDepositEGP: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0e172a] border border-cyan-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">مالك السيارة:</label>
              <select
                value={carForm.ownerId}
                onChange={(e) => {
                  const sel = owners.find(o => o.id === e.target.value);
                  setCarForm({
                    ...carForm,
                    ownerId: e.target.value,
                    ownership: e.target.value === 'owner-1' ? 'company' : 'investor',
                    ownerName: sel ? sel.name : 'شركة يمن الخليج'
                  });
                }}
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              >
                {owners.map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({o.ownerSharePercent}%)</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. ألبوم الصور المتعددة للسيارة (Multi-Image Gallery Manager) */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#c5a059]" /> 
                  <span>ألبوم صور السيارة (معرض العميل المتعدد):</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
                    {carForm.images?.length || 0} صور
                  </span>
                </label>
                <p className="text-[11px] text-slate-400">يمكنك رفع صور من جهازك أو إضافة روابط مباشرة</p>
              </div>

              {/* زر رفع ملف من الجهاز */}
              <label className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-[#c5a059] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>{isUploading ? 'جاري الرفع...' : 'رفع صورة من جهازك'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  disabled={isUploading}
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            {uploadMessage && (
              <div className="p-2 bg-slate-900 border border-[#c5a059]/40 text-[#f3e5ab] text-[11px] rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{uploadMessage}</span>
              </div>
            )}

            {/* حقل إضافة رابط صورة خارجي */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="أو الصق رابط صورة هنا (مثال: https://... أو /car-mercedes.jpg)"
                className="flex-1 bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059]"
              />
              <button
                type="button"
                onClick={addImageByUrl}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-[#c5a059] text-slate-300 hover:text-black font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة للألبوم
              </button>
            </div>

            {/* معاينة شبكة الصور المصغرة (Thumbnail Grid) */}
            {carForm.images && carForm.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                {carForm.images.map((imgUrl: string, idx: number) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-700/80 bg-slate-900 group">
                    <Image
                      src={imgUrl}
                      alt={`صورة ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                    {idx === 0 && (
                      <span className="absolute top-1 right-1 bg-[#c5a059] text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        الرئيسية
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImageAt(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity cursor-pointer"
                      title="حذف هذه الصورة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* أزرار الإجراءات */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-black font-black shadow-lg cursor-pointer"
            >
              {editingCar ? 'حفظ التعديلات ✓' : 'إضافة السيارة للأسطول ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
