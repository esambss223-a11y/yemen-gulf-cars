import WhyChooseUs from "./WhyChooseUs";
import "./booking-confidence.css";

const STEPS = [
  { number: "01", title: "اختر سيارتك", desc: "تصفح السيارات وحدد ما يناسب رحلتك." },
  { number: "02", title: "أكّد حجزك", desc: "نتفق معك على المدة والسعر ومكان التسليم." },
  { number: "03", title: "استلم وانطلق", desc: "استلم سيارتك في الموعد والمكان المتفق عليهما." },
];

export default function HowToBook() {
  return (
    <section id="how-to-book" className="booking-confidence" aria-labelledby="booking-confidence-title">
      <div className="booking-confidence-inner">
        <header className="booking-confidence-heading">
          <span>من الاختيار إلى الانطلاق</span>
          <h2 id="booking-confidence-title">سيارتك، بثلاث خطوات.</h2>
        </header>
        <ol className="booking-journey">
          {STEPS.map((step) => (
            <li key={step.number}>
              <span className="booking-step-number" aria-hidden="true">{step.number}</span>
              <div><h3>{step.title}</h3><p>{step.desc}</p></div>
            </li>
          ))}
        </ol>
        <WhyChooseUs />
      </div>
    </section>
  );
}
