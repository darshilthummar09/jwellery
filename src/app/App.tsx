import { useState } from "react";
import { MotionConfig } from "motion/react";
import { Navbar, MobileMenu } from "./components/sections/Navbar";
import { HeroSection } from "./components/sections/Hero";
import { StatsBar } from "./components/sections/StatsBar";
import { CollectionsSection } from "./components/sections/Collections";
import { DiamondShowcase } from "./components/sections/DiamondShowcase";
import { HeritageBanner } from "./components/sections/Heritage";
import { OccasionsSection } from "./components/sections/Occasions";
import { TestimonialsSection } from "./components/sections/Testimonials";
import { BespokeSection } from "./components/sections/Bespoke";
import { ContactSection } from "./components/sections/Contact";
import { Footer } from "./components/sections/Footer";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
        <style>{`
          html { scroll-behavior: smooth; }
          * { scrollbar-width: none; }
          *::-webkit-scrollbar { display: none; }

          button:not(:disabled), a[href] { cursor: pointer; touch-action: manipulation; }
          :focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; }
          ::selection { background: rgba(201, 168, 76, 0.35); color: #fff8e7; }

          @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>

        <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <MobileMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

        <HeroSection />
        <StatsBar />
        <CollectionsSection />
        <DiamondShowcase />
        <HeritageBanner />
        <OccasionsSection />
        <TestimonialsSection />
        <BespokeSection />
        <ContactSection />
        <Footer />
      </div>
    </MotionConfig>
  );
}
