import HeroSection from "./components/hero-section"
import CollectionSection from "./components/collection-section"
import MembershipSection from "./components/membership-section"
import HowItWorks from "./components/how-it-works"
import TestimonialSection from "./components/testimonial-section"
import MagazineSection from "./components/magazine-section"
import CTASection from "./components/cta-section"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <div id="coleccion">
        <CollectionSection />
      </div>
      <div id="membresias">
        <MembershipSection />
      </div>
      <div id="como-funciona">
        <HowItWorks />
      </div>
      <div id="testimonios">
        <TestimonialSection />
      </div>
      <div id="magazine">
        <MagazineSection />
      </div>
      <CTASection />
    </main>
  )
}
