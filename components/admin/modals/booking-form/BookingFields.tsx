import React from 'react';

export function BookingSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <section className="fleet-booking-section" aria-labelledby={id}>
      <header className="fleet-booking-section-heading">
        <span aria-hidden="true">{number}</span>
        <div>
          <h3 id={id}>{title}</h3>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

export function BookingInput({
  label,
  wide = false,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wide?: boolean }) {
  return (
    <label className={'fleet-booking-field' + (wide ? ' is-wide' : '')}>
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
