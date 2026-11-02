import HeroSection from "@/components/home/HeroSection";
import FeaturedFleet from "@/components/home/FeaturedFleet";
import ChauffeurAirportService from "@/components/home/ChauffeurAirportService";
import HowToBook from "@/components/home/HowToBook";
import OfficeLocation from "@/components/home/OfficeLocation";
import ScrollReveal from "@/components/home/ScrollReveal";

export default function Home() {
  return (
    <ScrollReveal>
      <HeroSection />
      <FeaturedFleet />
      <ChauffeurAirportService />
      <HowToBook />
      <OfficeLocation />
    </ScrollReveal>
  );
}
