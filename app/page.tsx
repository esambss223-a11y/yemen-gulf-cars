import HeroSection from "@/components/home/HeroSection";
import FeaturedFleet from "@/components/home/FeaturedFleet";
import ChauffeurAirportService from "@/components/home/ChauffeurAirportService";
import HowToBook from "@/components/home/HowToBook";
import WhyChooseUs from "@/components/home/WhyChooseUs";

export default function Home() {
  return (
    <div className="flex flex-col w-full scroll-snap-container">
      <div className="snap-section">
        <HeroSection />
      </div>
      <div className="snap-section">
        <FeaturedFleet />
      </div>
      <div className="snap-section">
        <ChauffeurAirportService />
      </div>
      <div className="snap-section">
        <HowToBook />
      </div>
      <div className="snap-section">
        <WhyChooseUs />
      </div>
    </div>
  );
}
