'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Car as CarIcon, X, Check } from 'lucide-react';
import { Car, VehicleOwner, OwnerCompensationType } from '@/types/fleet';
import { validateCarOffers } from '@/lib/car-offers';
import { uploadCarImage } from '@/lib/upload-car-image';
import './car-editor.css';
import '../fleet-design.css';

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
  insuranceExpiryDate?: string;
  nextServiceKm?: number;
  nextServiceDate?: string;
  serviceResponsibleParty?: 'company' | 'owner';
  dailyPriceEGP: number;
  originalDailyPriceEGP?: number;
  rentalPriceTiers?: Car['rentalPriceTiers'];
  weeklyPriceEGP: number;
  monthlyPriceEGP: number;
  securityDepositEGP: number;
  minRentalDays?: number;
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
  onSubmit: (e: React.FormEvent) => void | boolean | Promise<void | boolean>;
  operationError?: string;
  inline?: boolean;
  initialStep?: number;
}

export default function CarFormModal(props: CarFormModalProps) {
  // Each editor session owns its upload state and cancels requests when replaced.
  return <CarFormEditor key={`${props.isOpen ? 'open' : 'closed'}:${props.editingCar?.id ?? 'new'}:${props.initialStep ?? 0}`} {...props} />;
}

function CarFormEditor({
  isOpen,
  onClose,
  editingCar,
  carForm,
  setCarForm,
  owners,
  onSubmit,
  operationError = '',
  inline = false,
  initialStep = 0,
}: CarFormModalProps) {
  // 1. Hooks (جميع الهوكس في البداية دوماً)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState(false);
  const uploadController = useRef<AbortController | null>(null);
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
  const [step, setStep] = useState(initialStep ?? 0);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { formRef.current?.scrollTo({ top: 0 }); if (inline) document.querySelector('.admin-content')?.scrollTo({ top: 0 }); }, [step, inline]);
  useEffect(() => () => { uploadController.current?.abort(); }, [isOpen, editingCar?.id]);

  // توليد كود تلقائي أولي إذا كانت سيارة جديدة والكود فارغ
  useEffect(() => {
    if (isOpen && !editingCar && !carForm.carCode) {
      const randomNum = Math.floor(Math.random() * 899) + 101;
      setCarForm((prev) => ({ ...prev, carCode: `YG-${randomNum}` }));
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

  // رفع صورة أو عدة صور من الجهاز
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.currentTarget.value = '';
    uploadController.current?.abort();
    const controller = new AbortController();
    uploadController.current = controller;
    setIsUploading(true);
    setUploadError(false);
    setUploadMessage(files.length > 1 ? `جارٍ تجهيز ${files.length} صور ورفعها…` : 'جارٍ تجهيز الصورة ورفعها…');
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadCarImage(file, controller.signal);
        if (controller.signal.aborted) return;
        urls.push(url);
      }
      setCarForm((prev) => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      setUploadMessage(urls.length > 1 ? `تم رفع ${urls.length} صور بنجاح. احفظ بيانات السيارة لإظهارها في المعرض.` : 'تم رفع الصورة. احفظ بيانات السيارة لإظهارها في المعرض.');
    } catch (error) {
      if (controller.signal.aborted) return;
      setUploadError(true);
      setUploadMessage(error instanceof Error ? error.message : 'تعذر رفع الصورة. لم تُضف إلى السيارة.');
    } finally {
      if (uploadController.current === controller) setIsUploading(false);
    }
  };

  const submitEditor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isUploading || savingRef.current) return;
    if (!formRef.current?.reportValidity()) return;
    setFormError('');
    try {
      if (step >= 1) validateCarOffers(carForm);
      if (step === 1 && (!Number.isInteger(carForm.minRentalDays ?? 1) || (carForm.minRentalDays ?? 1) < 1 || (carForm.minRentalDays ?? 1) > 365)) throw new Error('أقل مدة للإيجار يجب أن تكون بين يوم و365 يومًا.');
      if (step < 2) { setStep(step + 1); return; }
      savingRef.current = true; setIsSaving(true);
      const saved = await onSubmit(event);
      if (saved === false) setFormError('لم تُحفظ السيارة. راجع رسالة الخطأ ثم أعد المحاولة؛ بياناتك ما زالت موجودة.');
    } catch (error) { setFormError(error instanceof Error ? error.message : 'تعذر حفظ السيارة. راجع البيانات وحاول مجددًا.'); }
    finally { savingRef.current = false; setIsSaving(false); }
  };

  return (
    <div className={inline ? 'fleet-car-form fleet-editor fleet-editor-v2 font-arabic' : 'fleet-car-form fleet-editor-v2 fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden font-arabic'}>
      {inline && <div className="fleet-editor-heading"><button type="button" disabled={isUploading || isSaving} onClick={onClose}>← رجوع إلى السيارات</button><span>{editingCar ? 'السيارات / تعديل البيانات' : 'السيارات / إضافة سيارة'}</span></div>}
      <div className={`fleet-car-editor-panel border rounded-2xl w-full flex flex-col ${inline ? '' : 'max-w-2xl max-h-[90vh] shadow-2xl my-auto overflow-hidden'}`}>
        
        {/* الترويسة المدمجة الأنيقة والمثبتة بالأعلى */}
        <div className="fleet-car-editor-header flex items-center justify-between border-b p-4 sm:px-6 sm:py-4 shrink-0 bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shadow-xs">
              <CarIcon className="w-5 h-5 text-amber-400 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                {editingCar ? `تعديل ${carForm.make} ${carForm.model}` : 'إضافة سيارة جديدة'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingCar ? 'حدّث البيانات ثم راجع الأسعار والصور قبل الحفظ.' : 'جهّز السيارة للعرض والحجز في ثلاث خطوات.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingCar && (
              <button
                type="button"
                disabled={isUploading || isSaving}
                onClick={() => { setFormError(''); setStep(step === 2 ? 0 : 2); }}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title={step === 2 ? 'العودة للبيانات الأساسية' : 'انتقال مباشر للصور والمعرض'}
              >
                <span>{step === 2 ? '← بيانات السيارة' : '📷 معرض الصور'}</span>
              </button>
            )}
            {!inline && (
              <button
                type="button"
                disabled={isUploading || isSaving}
                onClick={onClose}
                aria-label={inline ? 'رجوع إلى السيارات' : 'إغلاق تعديل السيارة'}
                className="text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <nav className="car-editor-steps" aria-label="خطوات بيانات السيارة">{['بيانات السيارة', 'الأسعار والعروض', 'الصور والتفاصيل'].map((title, index) => <button type="button" key={title} disabled={isUploading || isSaving || index > step} aria-current={index === step ? 'step' : undefined} onClick={() => { setFormError(''); setStep(index); }}><span>{index + 1}</span><strong>{title}<small>{['الاسم واللوحة وحالة التشغيل', 'أسعار المدد وشروط التأجير', 'المعرض والمالك والصيانة'][index]}</small></strong></button>)}</nav>
        {/* جسم الاستمارة القابل للتمرير الانسيابي الفاخر */}
        <form ref={formRef} id="car-form-modal" onSubmit={submitEditor} onInvalidCapture={event => { const details = (event.target as HTMLElement).closest('details'); if (details) details.open = true; }} className={`fleet-car-editor-form flex-1 p-4 sm:p-6 space-y-4 text-xs ${inline ? '' : 'overflow-y-auto overflow-x-hidden'}`}>
          <fieldset className="car-editor-step" hidden={step !== 0} disabled={step !== 0 || isSaving}>
          <legend className="sr-only">بيانات السيارة</legend>
          <section className="car-editor-availability" aria-labelledby="car-status-label">
            <label id="car-status-label" htmlFor="car-availability-status" className="mb-2 block text-sm font-bold text-white">حالة السيارة والتوفر</label>
            <select id="car-availability-status" value={carForm.status}
              onChange={(event) => setCarForm({ ...carForm, status: event.target.value as CarFormState['status'] })}
              aria-describedby="car-status-help"
              className="min-h-11 w-full rounded-lg border border-slate-600 bg-[#0b1322] px-3 py-2 text-base text-white focus:outline-2 focus:outline-[#c5a059]">
              <option value="available">متاحة للإيجار فوراً</option>
              <option value="rented">مؤجرة حالياً</option>
              <option value="maintenance">تحت الصيانة</option>
              <option value="cleaning">تحت التجهيز والغسيل</option>
              {carForm.status === 'archived' && <option value="archived" disabled>مؤرشفة — أعدها من الأرشيف أولًا</option>}
            </select>
            <p id="car-status-help" className="mt-2 text-xs leading-6 text-slate-300">الحالة تحدد التوفر للحجز. تغييرها لا يلغي العقود المسجلة.</p>
          </section>
          
          {/* 1. قسم بيانات المركبة الأساسية والكود مع البحث السريع والاقتراحات الذكية */}
          <CarBasicInfoSection
            allowPriceSuggestions={false}
            carForm={carForm}
            setCarForm={setCarForm}
            onGenerateCode={handleGenerateCode}
            onSelectCarPreset={(_specs, images) => setSuggestedImages(images)}
          />

          </fieldset>
          <fieldset className="car-editor-step" hidden={step !== 1} disabled={step !== 1 || isSaving}><legend className="sr-only">الأسعار والعروض</legend>
          {/* 2. قسم أسعار التأجير والتأمين */}
          <CarPricingSection
            carForm={carForm}
            setCarForm={setCarForm}
          />

          </fieldset>
          <fieldset className="car-editor-step" hidden={step !== 2} disabled={step !== 2 || isSaving}><legend className="sr-only">الصور والتفاصيل</legend>
          <CarImagesSection
            carForm={carForm}
            setCarForm={setCarForm}
            onRemoveImage={handleRemoveImage}
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            uploadMessage={uploadMessage}
            uploadError={uploadError}
            suggestedImages={suggestedImages}
          />
          <details className="car-editor-extra"><summary>الملكية والمالك — تفاصيل إضافية</summary>
          {/* 3. قسم التبعية والملكية والملاك */}
          <CarOwnershipSection
            carForm={carForm}
            setCarForm={setCarForm}
            owners={owners}
          />

          </details><details className="car-editor-extra"><summary>التراخيص والصيانة — تفاصيل إضافية</summary>
          {/* 4. قسم التراخيص، مدة التعاقد، وجدولة الصيانة الدورية */}
          <CarLicenseAndServiceSection
            carForm={carForm}
            setCarForm={setCarForm}
          />

          </details>
          {/* 5. قسم ألبوم الصور العصري والسلس مع اختيار الغلاف الرئيسي واقتراحات الكتالوج */}

          </fieldset>
          {(operationError || formError) && <p className="car-editor-error" role="alert">{operationError || formError}</p>}
        </form>

        {/* شريط الإجراءات السفلي الثابت والأنيق دائماً */}
        <div className="fleet-car-editor-footer p-3.5 sm:px-6 border-t flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="fleet-car-cancel px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors text-xs"
            disabled={isUploading || isSaving}
          >
            إلغاء
          </button>
          {step > 0 && <button type="button" className="fleet-car-cancel" disabled={isUploading || isSaving} onClick={() => { setFormError(''); setStep(step - 1); }}>السابق</button>}
          <button
            type="submit"
            form="car-form-modal"
            disabled={isUploading || isSaving}
            className="fleet-car-submit px-6 py-2.5 rounded-xl font-black cursor-pointer transition-all text-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isSaving ? 'جارٍ الحفظ…' : step < 2 ? 'التالي' : editingCar ? 'حفظ التعديلات' : 'إضافة السيارة للأسطول'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
