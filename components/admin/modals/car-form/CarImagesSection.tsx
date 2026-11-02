'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Upload, 
  Trash2, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle,
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
  uploadError?: boolean;
  suggestedImages?: string[];
}

export default function CarImagesSection({
  carForm,
  setCarForm,
  onRemoveImage,
  onFileUpload,
  isUploading,
  uploadMessage,
  uploadError = false,
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
    <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-4 font-arabic shadow-2xs">
      
      {/* رأس قسم الصور */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shadow-xs">
            <Layers className="w-5 h-5 text-amber-400 stroke-[2.2]" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>معرض وصور السيارة</span>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full">
                {imagesCount} {imagesCount === 1 ? 'صورة' : 'صور'}
              </span>
            </h5>
            <p className="text-xs text-slate-500 mt-0.5">
              اضغط على أي صورة لاختيارها كـ <strong className="text-slate-800 font-bold">&quot;غلاف رئيسي معتمد&quot;</strong> يظهر في واجهة المعرض للزوار.
            </p>
          </div>
        </div>

        {/* أزرار الإضافة السريعة */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-300 shadow-2xs active:scale-95"
          >
            <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>رابط مباشر</span>
          </button>

          <label className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95 border border-slate-900">
            <Upload className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span>{isUploading ? 'جاري الرفع...' : 'رفع من جهازك'}</span>
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isUploading}
              onChange={onFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* شريط صور الكتالوج الرسمية المقترحة للموديل */}
      {suggestedImages && suggestedImages.length > 0 && (
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-600" />
              صور الكتالوج المقترحة لهذا الموديل:
            </span>
            <button
              type="button"
              onClick={handleAddAllSuggested}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
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
                    alreadyAdded ? 'border-emerald-500 ring-2 ring-emerald-500/30 opacity-80' : 'border-slate-300 hover:border-slate-800'
                  }`}
                >
                  <Image src={sImg} alt={`صورة مقترحة ${sIdx + 1}`} fill className="object-cover" sizes="120px" />
                  
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {alreadyAdded ? (
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> مضافة
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddSuggestedImage(sImg)}
                        className="text-[10px] bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-md font-extrabold flex items-center gap-1 shadow-md cursor-pointer transition-transform"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" /> إضافة
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
        <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-2 animate-fadeIn">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="الصق رابط الصورة المباشر هنا (https://...)"
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono dir-ltr"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-all shadow-xs"
          >
            إضافة الصورة
          </button>
        </div>
      )}

      {/* إشعار حالة الرفع */}
      {uploadMessage && (
        <div className={'fleet-car-upload-message ' + (uploadError ? 'is-error' : 'is-success')} role={uploadError ? 'alert' : 'status'}>
          {uploadError ? <AlertCircle size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* شبكة الصور */}
      {imagesCount > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-1">
          {carForm.images.map((imgUrl: string, idx: number) => {
            const isCover = idx === 0;

            return (
              <div 
                key={idx} 
                className={`relative rounded-xl overflow-hidden border transition-all group flex flex-col justify-between bg-white ${
                  isCover
                    ? 'border-2 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-400 shadow-2xs'
                }`}
              >
                {/* الحاوية البصرية للصورة */}
                <div 
                  className="fleet-car-image-preview relative aspect-video w-full overflow-hidden bg-slate-950 cursor-pointer"
                  onClick={() => !isCover && handleSetAsCover(idx)}
                  title={isCover ? 'هذه هي الصورة الرئيسية المعتمدة للغلاف' : 'اضغط لتعيينها كصورة رئيسية للغلاف'}
                >
                  <Image
                    src={imgUrl}
                    alt={`صورة ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="220px"
                  />

                  <div className="fleet-car-image-shade absolute inset-0 pointer-events-none" />

                  {/* شارة الغلاف في الزاوية العلوية */}
                  {isCover ? (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-400 text-slate-950 shadow-md flex items-center gap-1 border border-amber-500">
                        <Check className="w-3 h-3 stroke-[3]" /> الغلاف المعتمد
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/85 text-white border border-white/20 backdrop-blur-xs">
                        #{idx + 1}
                      </span>
                    </div>
                  )}

                  {/* زر الحذف السريع - أبيض ناصع عالي التباين */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(idx);
                    }}
                    className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-slate-900/85 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer z-10 border border-white/20 shadow-sm"
                    title="حذف هذه الصورة"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                  </button>
                </div>

                {/* الشريط السفلي للتحكم */}
                <div className="p-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs bg-slate-50">
                  {isCover ? (
                    <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      معتمدة في الواجهة
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetAsCover(idx)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-900 text-slate-800 hover:text-white font-bold text-[11px] border border-slate-300 hover:border-slate-900 transition-all text-center cursor-pointer shadow-2xs"
                    >
                      تعيين كغلاف
                    </button>
                  )}

                  {/* أزرار الترتيب (واضحة، بيضاء، بأيقونات كحلية عالية التباين) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveImage(idx, idx - 1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                      title="تقديم للأمام"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-800 stroke-[2.2]" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === carForm.images.length - 1}
                      onClick={() => handleMoveImage(idx, idx + 1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                      title="تأخير للخلف"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-800 stroke-[2.2]" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

          {/* كرت الرفع المباشر داخل شبكة الصور */}
          <label className="border-2 border-dashed border-slate-300 hover:border-slate-800 bg-slate-50 hover:bg-slate-100/90 rounded-xl flex flex-col items-center justify-center p-3.5 text-center cursor-pointer transition-all group min-h-[130px] aspect-video">
            <div className="w-9 h-9 rounded-xl bg-white group-hover:bg-slate-900 text-slate-800 group-hover:text-amber-400 border border-slate-300 flex items-center justify-center mb-1.5 transition-all shadow-2xs">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition-colors">
              {isUploading ? 'جاري الرفع...' : 'رفع صورة من جهازك'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WEBP</span>
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isUploading}
              onChange={onFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
      ) : (
        /* منطقة الرفع الجذابة إذا لم تكن هناك صور */
        <label className="p-8 border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-slate-900 text-slate-700 group-hover:text-amber-400 border border-slate-300 flex items-center justify-center mb-2.5 transition-colors shadow-xs">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800">اضغط لاختيار صور من جهازك أو اسحبها هنا</p>
          <span className="text-[11px] text-slate-500 mt-1">يدعم ملفات JPG, PNG, WEBP بدقة عالية (يمكنك اختيار عدة صور)</span>
          <input 
            type="file" 
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isUploading}
            onChange={onFileUpload} 
            className="hidden" 
          />
        </label>
      )}

    </div>
  );
}
