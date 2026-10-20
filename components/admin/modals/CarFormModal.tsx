'use client';

import React, { useState, useEffect } from 'react';
import { Car as CarIcon, X, Check } from 'lucide-react';
import { Car, VehicleOwner, OwnerCompensationType } from '@/types/fleet';
import { supabase } from '@/lib/supabase';

// Subcomponents
import CarBasicInfoSection from './car-form/CarBasicInfoSection';
import CarPricingSection from './car-form/CarPricingSection';
import CarOwnershipSection from './car-form/CarOwnershipSection';
import CarLicenseAndServiceSection from './car-form/CarLicenseAndServiceSection';
import CarImagesSection from './car-form/CarImagesSection';

export interface CarFormState {
  carCode?: string;
  make: string;
  model: string;
  year: number;
  category: Car['category'];
  plateNumber: string;
  color: string;
  currentKm: number;
  initialHandoverKm?: number;
  fleetEntryDate?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  licenseExpiryDate?: string;
  licenseRenewalDate?: string;
  nextServiceKm?: number;
  nextServiceDate?: string;
  serviceResponsibleParty?: 'company' | 'owner';
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
  ownerCompensationType: OwnerCompensationType;
  ownerAgreedRateEGP: number;
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
  // 1. Hooks (جميع الهوكس في البداية دوماً)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);

  // توليد كود تلقائي أولي إذا كانت سيارة جديدة والكود فارغ
  useEffect(() => {
    if (isOpen && !editingCar && !carForm.carCode) {
      const randomNum = Math.floor(Math.random() * 899) + 101;
      setCarForm((prev) => ({ ...prev, carCode: `YG-${randomNum}` }));
    }
    if (!isOpen) {
      setSuggestedImages([]);
    }
  }, [isOpen, editingCar, carForm.carCode, setCarForm]);

  // إرجاع null بعد انتهاء تعريف كافة الهوكس فقط
  if (!isOpen) return null;

  // توليد كود تلقائي يدوي عند الضغط على الزر
  const handleGenerateCode = () => {
    const randomNum = Math.floor(Math.random() * 899) + 101;
    setCarForm((prev) => ({ ...prev, carCode: `YG-${randomNum}` }));
  };

  // حذف صورة معينة من الألبوم
  const handleRemoveImage = (index: number) => {
    setCarForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // رفع صورة من الجهاز
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('جاري رفع الصورة...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `car_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
      const filePath = `cars/${fileName}`;

      const { data, error } = await supabase.storage
        .from('car-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('car-images').getPublicUrl(filePath);

        setCarForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), publicUrl],
        }));
        setUploadMessage('تم رفع الصورة بنجاح ✓');
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setCarForm((prev) => ({
              ...prev,
              images: [...(prev.images || []), reader.result as string],
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
      setTimeout(() => setUploadMessage(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden font-arabic">
      <div className="bg-[#0b1322] border border-[#c5a059]/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-auto text-slate-200 overflow-hidden">
        
        {/* الترويسة المدمجة الأنيقة والمثبتة بالأعلى */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:px-6 sm:py-4 shrink-0 bg-[#0b1322]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059]">
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                {editingCar ? `تعديل بيانات سيارة: ${editingCar.make} ${editingCar.model}` : 'إضافة سيارة جديدة لأسطول يمن الخليج'}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400">
                إدارة كاملة لبيانات السيارة، المالك، التراخيص، الصيانة، ومعرض الصور
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* جسم الاستمارة القابل للتمرير الانسيابي الفاخر */}
        <form id="car-form-modal" onSubmit={onSubmit} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 text-xs">
          
          {/* 1. قسم بيانات المركبة الأساسية والكود مع البحث السريع والاقتراحات الذكية */}
          <CarBasicInfoSection
            carForm={carForm}
            setCarForm={setCarForm}
            onGenerateCode={handleGenerateCode}
            onSelectCarPreset={(_specs, images) => setSuggestedImages(images)}
          />

          {/* 2. قسم أسعار التأجير والتأمين */}
          <CarPricingSection
            carForm={carForm}
            setCarForm={setCarForm}
          />

          {/* 3. قسم التبعية والملكية والملاك */}
          <CarOwnershipSection
            carForm={carForm}
            setCarForm={setCarForm}
            owners={owners}
          />

          {/* 4. قسم التراخيص، مدة التعاقد، وجدولة الصيانة الدورية */}
          <CarLicenseAndServiceSection
            carForm={carForm}
            setCarForm={setCarForm}
          />

          {/* 5. قسم ألبوم الصور العصري والسلس مع اختيار الغلاف الرئيسي واقتراحات الكتالوج */}
          <CarImagesSection
            carForm={carForm}
            setCarForm={setCarForm}
            onRemoveImage={handleRemoveImage}
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            uploadMessage={uploadMessage}
            suggestedImages={suggestedImages}
          />
        </form>

        {/* شريط الإجراءات السفلي الثابت والأنيق دائماً */}
        <div className="p-3.5 sm:px-6 border-t border-slate-800 bg-[#070e1b] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors text-xs"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="car-form-modal"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5a059] hover:from-[#e0bc45] hover:to-[#d4af37] text-slate-950 font-black shadow-lg cursor-pointer transition-all text-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{editingCar ? 'حفظ التعديلات' : 'إضافة السيارة للأسطول'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
