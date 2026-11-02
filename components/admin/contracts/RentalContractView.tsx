'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileCheck2, 
  LayoutDashboard, 
  Printer, 
  MessageSquare, 
  X, 
  Car, 
  FileEdit, 
  AlertCircle, 
  Check, 
  Calendar,
  Sparkles
} from 'lucide-react';
import type { Booking } from '@/types/fleet';
import { BOOKING_STATUS_LABELS } from '@/lib/car-record';
import { printContract } from '@/lib/print-contract';
import { getContractWhatsAppUrl } from '@/lib/contract-whatsapp';
import RentalBookingDetails from './RentalBookingDetails';
import RentalContractDocument from './RentalContractDocument';
import ContractOfficeEditor from './ContractOfficeEditor';
import { contractRequest } from '@/lib/contract-client';
import type { ContractDetails, ContractRecord } from '@/lib/rental-contract';
import './contract-print.css';

export default function RentalContractView({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return <ContractViewer key={booking.id} booking={booking} onClose={onClose} />;
}

function ContractViewer({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [view, setView] = useState<'details' | 'office' | 'print'>('details');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [record, setRecord] = useState<ContractRecord | null>(booking.contractRecord || null);
  const [defaults, setDefaults] = useState<ContractDetails>({});
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    contractRequest(booking.id, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setRecord(result.record);
          setDefaults(result.defaults || {});
          setCanEdit(Boolean(result.canEdit));
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setError(failure instanceof Error ? failure.message : 'تعذر تحميل بيانات العقد.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [booking.id]);

  const documentBooking = {
    ...booking,
    contractRecord: record || {
      revision: '',
      details: defaults,
      attachments: [],
      updatedAt: '',
      updatedBy: '',
    },
  };

  const close = () => {
    if (!dirty || window.confirm('توجد تعديلات غير محفوظة على العقد. هل تريد إغلاقها؟')) {
      onClose();
    }
  };

  const documentRef = useRef<HTMLDivElement>(null);
  const nativePrintRef = useRef<HTMLDivElement>(null);

  const print = async () => {
    const sheet = nativePrintRef.current?.querySelector<HTMLElement>('.rental-document');
    if (!sheet || busy || loading || dirty) return;
    setBusy(true);
    setError('');
    try {
      await printContract(sheet, 'عقد إيجار — ' + booking.bookingNumber);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'تعذر تجهيز العقد للطباعة.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      dir="rtl"
    >
      <div 
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rental-contract-title"
      >
        {/* 1. Header (Deep Slate & Crisp White - Luxury Automotive Tone) */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              {booking.bookingNumber}
            </span>
            <div className="min-w-0">
              <h2 id="rental-contract-title" className="text-base font-extrabold truncate text-white">
                عقد وتفاصيل الحجز
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-slate-300 font-semibold">{booking.carName}</span>
                <span>·</span>
                <span className="font-mono" dir="auto">{booking.carPlate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status Pill */}
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
              {BOOKING_STATUS_LABELS[booking.status] || booking.status}
            </span>

            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="إغلاق العقد"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* 2. Responsive Segmented Toolbar (Tabs) */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setView('details')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                view === 'details'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard size={13} />
              <span>ملخص العقد والبيانات</span>
            </button>

            <button
              type="button"
              onClick={() => setView('office')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                view === 'office'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <FileEdit size={13} />
              <span>تجهيز العقد والمرفقات</span>
            </button>

            <button
              type="button"
              disabled={dirty || loading}
              onClick={() => setView('print')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                view === 'print'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <FileCheck2 size={13} />
              <span>معاينة العقد A4</span>
            </button>
          </div>

          {dirty && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <AlertCircle size={12} />
              تعديلات غير محفوظة
            </span>
          )}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="px-5 py-2 bg-rose-50 border-b border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-1.5">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. Modal Body (Scrollable, Clean, Space-Efficient) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading && (
            <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
              <span>جارٍ تحميل ملف العقد والبيانات المعتمدة…</span>
            </div>
          )}

          {/* VIEW 1: DETAILS & SUMMARY */}
          {!loading && view === 'details' && (
            <RentalBookingDetails booking={documentBooking} />
          )}

          {/* VIEW 2: OFFICE DATA COMPLETION & ATTACHMENTS */}
          {!loading && view === 'office' && (
            <div className="max-w-3xl mx-auto">
              <ContractOfficeEditor
                key={record?.revision || 'new'}
                booking={booking}
                record={record}
                defaults={defaults}
                canEdit={canEdit}
                busy={busy}
                onBusy={setBusy}
                onDirty={setDirty}
                onSaved={(val) => {
                  setRecord(val);
                  setError('');
                }}
              />
            </div>
          )}

          {/* VIEW 3: PRINT PREVIEW A4 */}
          {!loading && view === 'print' && (
            <div className="space-y-3">
              <p className="text-center text-xs text-slate-500 leading-relaxed">
                يُطبع العقد على ورق مقاس A4 ويوقَّع بالقلم داخل المكتب. البيانات الفارغة تُستكمل يدوياً.
              </p>
              <ContractPreview booking={documentBooking} documentRef={documentRef} />
            </div>
          )}
        </div>

        {/* 4. Sticky Action Footer (Mobile-First, Space-Efficient) */}
        <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <div className="text-xs text-slate-500 hidden md:block">
            {booking.carName} · <bdi className="font-mono text-slate-700 font-bold">{booking.carPlate}</bdi>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={close}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              إغلاق
            </button>

            {/* WhatsApp Summary Button */}
            <a
              href={busy || dirty || loading ? undefined : getContractWhatsAppUrl(documentBooking)}
              aria-disabled={busy || dirty || loading}
              onClick={(e) => {
                if (busy || dirty || loading) e.preventDefault();
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
              title="إرسال ملخص العقد للعميل عبر واتساب"
            >
              <MessageSquare size={14} aria-hidden="true" />
              <span>إرسال واتساب</span>
            </a>

            {/* Print Button */}
            <button
              type="button"
              disabled={busy || dirty || loading}
              onClick={print}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Printer size={14} aria-hidden="true" />
              <span>{busy ? 'جارٍ التجهيز…' : 'طباعة العقد (A4)'}</span>
            </button>
          </div>
        </footer>
      </div>

      {/* Hidden Portal for Print Execution */}
      <ContractPrintLayer booking={documentBooking} printRef={nativePrintRef} />
    </div>
  );
}

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function ContractPrintLayer({
  booking,
  printRef,
}: {
  booking: Booking;
  printRef: RefObject<HTMLDivElement | null>;
}) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return mounted
    ? createPortal(
        <div ref={printRef} className="fleet-contract-native-print" aria-hidden="true">
          <RentalContractDocument booking={booking} />
        </div>,
        document.body
      )
    : null;
}

function ContractPreview({
  booking,
  documentRef,
}: {
  booking: Booking;
  documentRef: RefObject<HTMLDivElement | null>;
}) {
  const container = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 1, height: 1123 });

  useEffect(() => {
    const update = () => {
      if (!container.current || !sheet.current || !container.current.clientWidth) return;
      const scale = Math.min(1, container.current.clientWidth / sheet.current.offsetWidth);
      const height = sheet.current.offsetHeight;
      setSize((prev) => (prev.scale === scale && prev.height === height ? prev : { scale, height }));
    };
    const observer = new ResizeObserver(update);
    if (container.current) observer.observe(container.current);
    if (sheet.current) observer.observe(sheet.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className="w-full max-w-[210mm] mx-auto overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-100 p-2 sm:p-4">
      <div className="relative w-full" style={{ height: size.height * size.scale }}>
        <div
          ref={sheet}
          className="absolute top-0 right-0 w-[210mm] bg-white p-[10mm] border border-slate-300 shadow-md origin-top-right"
          style={{ transform: `scale(${size.scale})` }}
        >
          <div ref={documentRef}>
            <RentalContractDocument booking={booking} />
          </div>
        </div>
      </div>
    </div>
  );
}
