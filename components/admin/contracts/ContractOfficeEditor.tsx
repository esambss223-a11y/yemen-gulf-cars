'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Save, Upload, AlertCircle, Check, Paperclip } from 'lucide-react';
import type { Booking } from '@/types/fleet';
import { MAX_CONTRACT_FILE_BYTES, validateContractDetails, type ContractDetails, type ContractRecord } from '@/lib/rental-contract';
import ContractFields, { CONTRACT_GROUPS } from './ContractFields';
import { contractRequest } from '@/lib/contract-client';
import FleetFormSection from '../modals/FleetFormSection';

interface Props {
  booking: Booking;
  record: ContractRecord | null;
  defaults: ContractDetails;
  canEdit: boolean;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onDirty: (dirty: boolean) => void;
  onSaved: (record: ContractRecord) => void;
}

export default function ContractOfficeEditor({
  booking,
  record,
  defaults,
  canEdit,
  busy,
  onBusy,
  onDirty,
  onSaved,
}: Props) {
  const original = record?.details ?? defaults;
  const [draft, setDraft] = useState<ContractDetails>(original);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const dirty = JSON.stringify(draft) !== JSON.stringify(original);

  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !canEdit) return;
    setMessage('');
    let details: ContractDetails;
    try {
      details = validateContractDetails(draft, booking.finalTotalEGP);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'راجع البيانات المدخلة.');
      return;
    }
    onBusy(true);
    try {
      const result = await contractRequest(booking.id, { details, revision: record?.revision });
      if (result.record) onSaved(result.record);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حفظ بيانات العقد.');
    } finally {
      onBusy(false);
    }
  };

  const upload = async () => {
    if (!file || busy || dirty || !canEdit) return;
    setMessage('');
    if (
      !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > MAX_CONTRACT_FILE_BYTES ||
      !file.size
    ) {
      setMessage('اختر ملف PDF أو صورة JPG/PNG/WEBP بحجم لا يتجاوز 4 ميجابايت.');
      return;
    }
    onBusy(true);
    try {
      const result = await contractRequest(booking.id, { file, revision: record?.revision });
      if (result.record) {
        onSaved(result.record);
        setFile(null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر رفع المرفق.');
    } finally {
      onBusy(false);
    }
  };

  const download = async (fileId: string) => {
    if (busy) return;
    setMessage('');
    onBusy(true);
    try {
      const { url } = await contractRequest(booking.id, { fileId });
      if (!url?.startsWith('https://')) throw new Error('تعذر فتح المرفق.');
      const link = document.createElement('a');
      link.href = url;
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تنزيل المرفق.');
    } finally {
      onBusy(false);
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-800">
      
      {/* Notice Banner */}
      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-600 leading-relaxed">
        اطبع العقد للتوقيع بالقلم داخل المكتب. البيانات التي تُترك فارغة يمكن استكمالها يدوياً. إرفاق صورة العقد الموقَّع أو سكان من الطابعة اختياري لحفظ الأرشيف.
      </div>

      {message && (
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 flex items-center gap-2" role="alert">
          <AlertCircle size={15} />
          <span>{message}</span>
        </div>
      )}

      {/* Contract Data Form */}
      <form onSubmit={save} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-extrabold text-xs text-slate-900">
            استكمال بيانات وثيقة العقد المطبوعة
          </span>
          {dirty && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              تغييرات غير محفوظة
            </span>
          )}
        </div>

        <fieldset disabled={!canEdit || busy} className="space-y-4 border-0 p-0 m-0">
          {CONTRACT_GROUPS.map((group, index) => (
            <FleetFormSection
              key={group.title}
              number={String(index + 1).padStart(2, '0')}
              title={group.title}
              description={
                group.key === 'payment'
                  ? 'حسب إيصال السداد. هذا البيان للطباعة ولا يغيّر الفواتير أو يسجّل تحصيلًا جديدًا.'
                  : 'تُترك البيانات غير المتوفرة فارغة لاستكمالها بالقلم في المكتب.'
              }
            >
              <ContractFields
                fields={group.fields}
                value={draft}
                onChange={setDraft}
                rentTotal={booking.finalTotalEGP}
              />
            </FleetFormSection>
          ))}

          {canEdit && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={busy || !dirty}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Save size={14} />
                <span>{busy ? 'جارٍ الحفظ…' : 'حفظ بيانات العقد'}</span>
              </button>
            </div>
          )}
        </fieldset>
      </form>

      {/* Paper Contract Attachments Archive */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
            <Paperclip size={15} className="text-slate-500" />
            أرشيف النسخة الورقية الموقعة (اختياري)
          </span>
          <span className="text-[11px] text-slate-500">
            {record?.attachments.length || 0} / 8 مرفقات
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          ارفع صورة من الهاتف أو ملف سكان من الطابعة بعد التوقيع بالقلم. يدعم PDF / JPG / PNG حتى 4 ميجابايت للملف.
        </p>

        {/* Existing Attachments */}
        {record?.attachments.length ? (
          <div className="space-y-1.5 pt-1">
            {record.attachments.map((att, idx) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={16} className="text-slate-500 flex-shrink-0" />
                  <div className="truncate">
                    <strong className="block truncate text-slate-900 font-bold">
                      مرفق العقد {idx + 1} ({att.type === 'application/pdf' ? 'PDF' : 'صورة'})
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      بواسطة: {att.uploadedBy} · {(att.size / 1024).toFixed(0)} ك.ب
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => download(att.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex-shrink-0"
                >
                  <Download size={13} />
                  <span>تنزيل</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-[11px]">
            لم تُرفق نسخة ورقية لهذا العقد بعد.
          </p>
        )}

        {/* File Picker */}
        {canEdit && (
          <div className="pt-2 space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setMessage('');
                }}
                className="flex-1 text-xs text-slate-600 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:bg-slate-100 file:text-xs file:font-semibold hover:file:bg-slate-200 cursor-pointer"
              />

              <button
                type="button"
                disabled={busy || !file || dirty || (record?.attachments.length || 0) >= 8}
                onClick={upload}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
              >
                <Upload size={14} />
                <span>{busy ? 'جارٍ الرفع…' : 'إرفاق النسخة'}</span>
              </button>
            </div>

            {file && (
              <span className="text-[11px] text-slate-600 block">
                الملف المختار: <b className="font-mono text-slate-800">{file.name}</b> ({(file.size / 1024).toFixed(0)} ك.ب)
              </span>
            )}
          </div>
        )}

        {record?.updatedBy && (
          <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100">
            آخر تعديل محفوظ: {record.updatedBy} · {new Date(record.updatedAt).toLocaleString('ar-EG')}
          </div>
        )}
      </div>
    </div>
  );
}
