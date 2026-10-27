'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import './booking-form.css';

interface Props {
  title: string;
  description: string;
  titleId: string;
  onClose: () => void;
  busy?: boolean;
  closeLabel?: string;
  children: ReactNode;
}

export default function FleetDialog({ title, description, titleId, onClose, busy = false, closeLabel = 'إغلاق النافذة', children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={dialogRef} className="fleet-dialog" dir="rtl" aria-labelledby={titleId}
    aria-describedby={titleId + '-description'} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="fleet-dialog-shell">
      <header className="fleet-dialog-header">
        <div className="fleet-dialog-title"><span className="fleet-dialog-eyebrow">اليمن والخليج / إدارة التأجير</span>
          <h2 id={titleId} tabIndex={-1} autoFocus>{title}</h2><p id={titleId + '-description'}>{description}</p></div>
        <Image className="fleet-dialog-logo" src="/logo2.png" alt="شركة اليمن والخليج" width={144} height={60} />
        <button type="button" className="fleet-dialog-close" aria-label={closeLabel} disabled={busy} onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </header>
      {children}
    </div>
  </dialog>;
}
