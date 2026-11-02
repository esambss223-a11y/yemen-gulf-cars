const BENEFITS = [
  { title: "جاهزة لرحلتك", desc: "نظافة وفحص قبل التسليم." },
  { title: "التسليم حيث يناسبك", desc: "نسّق الاستلام في المطار أو مقر إقامتك." },
  { title: "مدة تناسب خطتك", desc: "خيارات يومية وأسبوعية وشهرية." },
  { title: "تفاصيل واضحة", desc: "تأكيد السعر وشروط الإيجار قبل الحجز." },
];

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="booking-benefits" aria-labelledby="booking-benefits-title">
      <h2 id="booking-benefits-title">التفاصيل التي تصنع الفرق.</h2>
      <dl className="booking-benefits-list">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title}><dt>{benefit.title}</dt><dd>{benefit.desc}</dd></div>
        ))}
      </dl>
    </section>
  );
}
