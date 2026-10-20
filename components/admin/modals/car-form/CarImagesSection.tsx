'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Upload, 
  Trash2, 
  Link as LinkIcon, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Camera, 
  Layers, 
  Check,
  Plus
} from 'lucide-react';
import { CarFormState } from '../CarFormModal';

interface CarImagesSectionProps {
  carForm: CarFormState;
  setCarForm: React.Dispatch<React.SetStateAction<CarFormState>>;
  onRemoveImage: (index: number) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  uploadMessage: string | null;
  suggestedImages?: string[];
}

export default function CarImagesSection({
  carForm,
  setCarForm,
  onRemoveImage,
  onFileUpload,
  isUploading,
  uploadMessage,
  suggestedImages = [],
}: CarImagesSectionProps) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // تعيين أي صورة كصورة رئيسية للغلاف بنقرة واحدة (نقلها إلى index 0)
  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    setCarForm((prev) => {
      const selected = prev.images[index];
      if (!selected) return prev;
      const remaining = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: [selected, ...remaining],
      };
    });
  };

  // تحريك ترتيب الصور
  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    setCarForm((prev) => {
      if (toIndex < 0 || toIndex >= prev.images.length) return prev;
      const updated = [...prev.images];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return {
        ...prev,
        images: updated,
      };
    });
  };

  // إضافة صورة بالرابط
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setCarForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), urlInput.trim()],
    }));
    setUrlInput('');
    setShowUrlInput(false);
  };

  // إضافة صورة مقترحة مفردة
  const handleAddSuggestedImage = (imgUrl: string) => {
    setCarForm((prev) => {
      const filtered = prev.images.filter((img) => img !== '/car-mercedes.jpg');
      if (filtered.includes(imgUrl)) return prev;
      return {
        ...prev,
        images: [...filtered, imgUrl],
      };
    });
  };

  // إضافة كل الصور المقترحة بنقرة واحدة
  const handleAddAllSuggested = () => {
    if (!suggestedImages || suggestedImages.length === 0) return;
    setCarForm((prev) => {
      const filtered = prev.images.filter((img) => img !== '/car-mercedes.jpg');
      const newImages = [...filtered];
      for (const img of suggestedImages) {
        if (!newImages.includes(img)) {
          newImages.push(img);
        }
      }
      return {
        ...prev,
        images: newImages,
      };
    });
  };

  const imagesCount = carForm.images?.length || 0;

  return (
    <div className="p-4 bg-[#070d19] border border-slate-800 rounded-2xl space-y-3.5 font-arabic">
      
      {/* رأس قسم الصور */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#c5a059]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
              معرض وصور السيارة
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {imagesCount} {imagesCount === 1 ? 'صورة' : 'صور'}
              </span>
            </h5>
            <p className="text-[10px] text-slate-400">
              اضغط على أي صورة لاختيارها كـ <strong>&quot;غلاف رئيسي&quot;</strong> يظهر في واجهة المعرض
            </p>
          </div>
        </div>

        {/* أزرار الإضافة السريعة */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
          >
            <LinkIcon className="w-3 h-3 text-slate-400" />
            <span>رابط مباشر</span>
          </button>

          <label className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5a059] hover:from-[#e0bc45] hover:to-[#d4af37] text-slate-950 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'جاري الرفع...' : 'رفع من جهازك'}</span>
            <input 
              type="file" 
              accept="image/*" 
              disabled={isUploading}
              onChange={onFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* شريط صور الكتالوج الرسمية المقترحة للموديل */}
      {suggestedImages && suggestedImages.length > 0 && (
        <div className="p-3 bg-[#0b1426] border border-[#c5a059]/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#c5a059]" />
              صور الكتالوج المقترحة لهذا الموديل:
            </span>
            <button
              type="button"
              onClick={handleAddAllSuggested}
              className="text-[10px] text-amber-300 hover:text-white underline cursor-pointer"
            >
              + إضافة جميع الصور المقترحة ({suggestedImages.length})
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
            {suggestedImages.map((sImg, sIdx) => {
              const alreadyAdded = carForm.images.includes(sImg);
              return (
                <div
                  key={sIdx}
                  className={`relative w-28 h-18 rounded-lg overflow-hidden shrink-0 border transition-all group ${
                    alreadyAdded ? 'border-emerald-500/60 opacity-80' : 'border-slate-700 hover:border-[#c5a059]'
                  }`}
                >
                  <Image src={sImg} alt={`صورة مقترحة ${sIdx + 1}`} fill className="object-cover" sizes="120px" />
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {alreadyAdded ? (
                      <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> مضافة
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddSuggestedImage(sImg)}
                        className="text-[9px] bg-gradient-to-r from-[#d4af37] to-[#c5a059] text-black px-2 py-1 rounded-md font-black flex items-center gap-1 shadow-md cursor-pointer hover:scale-105 transition-transform"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" /> إضافة
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* حقل إدخال الرابط إن تم فتحه */}
      {showUrlInput && (
        <div className="p-2.5 bg-[#0b1322] border border-slate-700/80 rounded-xl flex items-center gap-2 animate-fadeIn">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="الصق رابط الصورة المباشر هنا (https://...)"
            className="flex-1 bg-[#060b14] border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059] font-mono dir-ltr"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3.5 py-1.5 bg-[#c5a059] hover:bg-[#d4af37] text-black font-bold text-xs rounded-lg cursor-pointer transition-all"
          >
            إضافة
          </button>
        </div>
      )}

      {/* إشعار حالة الرفع */}
      {uploadMessage && (
        <div className="p-2 bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* شبكة الصور المنظمة العالمية */}
      {imagesCount > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
          {carForm.images.map((imgUrl: string, idx: number) => {
            const isCover = idx === 0;

            return (
              <div 
                key={idx} 
                className={`relative rounded-xl overflow-hidden border transition-all group flex flex-col justify-between ${
                  isCover
                    ? 'border-2 border-[#c5a059] shadow-md shadow-[#c5a059]/15 bg-[#0b1322]'
                    : 'border-slate-800 bg-[#0b1322] hover:border-slate-600'
                }`}
              >
                {/* الحاوية البصرية للصورة */}
                <div 
                  className="relative aspect-video w-full overflow-hidden bg-slate-950 cursor-pointer"
                  onClick={() => !isCover && handleSetAsCover(idx)}
                  title={isCover ? 'هذه هي الصورة الرئيسية المعتمدة للغلاف' : 'اضغط لتعيينها كصورة رئيسية للغلاف'}
                >
                  <Image
                    src={imgUrl}
                    alt={`صورة ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="200px"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* شارة الغلاف في الزاوية */}
                  {isCover ? (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#c5a059] text-black shadow-md flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> الغلاف الرئيسي
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/70 text-slate-300 border border-slate-700">
                        #{idx + 1}
                      </span>
                    </div>
                  )}

                  {/* زر الحذف السريع */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(idx);
                    }}
                    className="absolute top-2 left-2 w-6 h-6 rounded-md bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                    title="حذف الصورة"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* الشريط السفلي للتحكم */}
                <div className="p-2 border-t border-slate-800 flex items-center justify-between gap-1 text-[11px] bg-[#080d19]">
                  {isCover ? (
                    <span className="text-[10px] font-bold text-[#c5a059] flex items-center gap-1">
                      ● معتمدة في الواجهة
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetAsCover(idx)}
                      className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-[#c5a059] text-slate-300 hover:text-black font-semibold text-[10px] transition-all text-center cursor-pointer"
                    >
                      تعيين كغلاف
                    </button>
                  )}

                  {/* أزرار الترتيب */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveImage(idx, idx - 1)}
                      className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      title="تقديم"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === carForm.images.length - 1}
                      onClick={() => handleMoveImage(idx, idx + 1)}
                      className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      title="تأخير"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* منطقة الرفع الجذابة إذا لم تكن هناك صور */
        <label className="p-8 border-2 border-dashed border-slate-800 hover:border-[#c5a059]/50 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer bg-[#050912] transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 group-hover:bg-[#c5a059]/10 text-slate-400 group-hover:text-[#c5a059] flex items-center justify-center mb-2.5 transition-colors">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-200">اضغط لاختيار صور من جهازك أو اسحبها هنا</p>
          <span className="text-[10px] text-slate-500 mt-1">يدعم ملفات JPG, PNG, WEBP بدقة عالية</span>
          <input 
            type="file" 
            accept="image/*" 
            disabled={isUploading}
            onChange={onFileUpload} 
            className="hidden" 
          />
        </label>
      )}

    </div>
  );
}
