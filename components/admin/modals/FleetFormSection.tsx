import type { ReactNode } from 'react';

export default function FleetFormSection({ number, title, description, children }: {
  number: string; title: string; description: string; children: ReactNode;
}) {
  return <section className="fleet-booking-section" aria-label={title}>
    <header className="fleet-booking-section-heading"><span aria-hidden="true">{number}</span>
      <div><h3>{title}</h3><p>{description}</p></div>
    </header>{children}
  </section>;
}
