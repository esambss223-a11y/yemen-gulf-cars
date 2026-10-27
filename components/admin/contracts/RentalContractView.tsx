'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { FileCheck2, LayoutDashboard, Printer } from 'lucide-react';
import type { Booking } from '@/types/fleet';
import { BOOKING_STATUS_LABELS } from '@/lib/car-record';
import { printContract } from '@/lib/print-contract';
import FleetDialog from '../modals/FleetDialog';
import RentalBookingDetails from './RentalBookingDetails';
import RentalContractDocument from './RentalContractDocument';
import './rental-contract.css';
import './contract-print.css';

export default function RentalContractView({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [view, setView] = useState<'details' | 'print'>('details');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const documentRef = useRef<HTMLDivElement>(null);
  const nativePrintRef = useRef<HTMLDivElement>(null);
  const print = async () => {
    const sheet = nativePrintRef.current?.querySelector<HTMLElement>('.rental-document');
    if (!sheet || busy) return;
    setBusy(true); setError('');
    try { await printContract(sheet, 'عقد إيجار — ' + booking.bookingNumber); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'تعذر تجهيز العقد للطباعة.'); }
    finally { setBusy(false); }
  };
  return <><FleetDialog title="عقد وتفاصيل الحجز" description={booking.bookingNumber + ' · ' + BOOKING_STATUS_LABELS[booking.status]}
    titleId="rental-contract-title" onClose={onClose} busy={busy} closeLabel="إغلاق تفاصيل العقد">
    <div className="fleet-contract-toolbar"><div className="fleet-contract-views" role="group" aria-label="طريقة عرض الحجز">
      <button className={view === 'details' ? 'is-selected' : ''} type="button" aria-pressed={view === 'details'} onClick={() => setView('details')}><LayoutDashboard size={16} aria-hidden="true" />تفاصيل الحجز</button>
      <button className={view === 'print' ? 'is-selected' : ''} type="button" aria-pressed={view === 'print'} onClick={() => setView('print')}><FileCheck2 size={16} aria-hidden="true" />معاينة العقد A4</button>
    </div><button type="button" className="fleet-booking-button is-primary" onClick={print} disabled={busy}><Printer size={17} aria-hidden="true" />{busy ? 'تجهيز الطباعة…' : 'طباعة / حفظ PDF'}</button></div>
    {error && <p className="fleet-booking-submit-error" role="alert">{error}</p>}
    <div className="fleet-contract-scroll"><div hidden={view !== 'details'}><RentalBookingDetails booking={booking} /></div>
      <div hidden={view !== 'print'}><p className="fleet-contract-preview-caption">معاينة مصغّرة للورقة. الطباعة مستقلة بمقاس A4، والملاحظات الطويلة تستكمل في صفحات إضافية.</p><ContractPreview booking={booking} documentRef={documentRef} /></div>
    </div>
    <footer className="fleet-booking-footer"><p className="fleet-contract-footer-note">{booking.carName} · <bdi>{booking.carPlate}</bdi></p><button type="button" className="fleet-booking-button" disabled={busy} onClick={onClose}>إغلاق</button><button type="button" className="fleet-booking-button is-primary" disabled={busy} onClick={print}><Printer size={17} aria-hidden="true" />{busy ? 'تجهيز الطباعة…' : 'طباعة العقد'}</button></footer>
  </FleetDialog><ContractPrintLayer booking={booking} printRef={nativePrintRef} /></>;
}

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
function ContractPrintLayer({ booking, printRef }: { booking: Booking; printRef: RefObject<HTMLDivElement | null> }) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return mounted ? createPortal(<div ref={printRef} className="fleet-contract-native-print" aria-hidden="true"><RentalContractDocument booking={booking} /></div>, document.body) : null;
}

function ContractPreview({ booking, documentRef }: { booking: Booking; documentRef: RefObject<HTMLDivElement | null> }) {
  const container = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 1, height: 1123 });
  useEffect(() => {
    const update = () => {
      if (!container.current || !sheet.current || !container.current.clientWidth) return;
      const scale = Math.min(1, container.current.clientWidth / sheet.current.offsetWidth);
      const height = sheet.current.offsetHeight;
      setSize((previous) => previous.scale === scale && previous.height === height ? previous : { scale, height });
    };
    const observer = new ResizeObserver(update);
    if (container.current) observer.observe(container.current);
    if (sheet.current) observer.observe(sheet.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} className="fleet-contract-preview"><div className="fleet-contract-preview-space" style={{ height: size.height * size.scale }}>
    <div ref={sheet} className="fleet-contract-preview-sheet" style={{ transform: 'scale(' + size.scale + ')' }}><div ref={documentRef}><RentalContractDocument booking={booking} /></div></div>
  </div></div>;
}
