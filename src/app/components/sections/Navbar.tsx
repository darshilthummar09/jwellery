import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "../../data/site";
import { DiamondSVG } from "./shared";

export function Navbar({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-500"
      style={{
        background: scrolled ? "rgba(10,6,8,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(201,168,76,0.2)" : "none",
      }}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <a href="#top" className="flex items-center gap-3" aria-label="Dream Jewels — back to top">
        <DiamondSVG style={{ width: 32, height: 32 }} />
        <div>
          <div className="font-['Cinzel'] text-lg font-bold tracking-widest text-accent leading-none">Dream</div>
          <div className="font-['Cinzel'] text-xs tracking-[0.35em] text-primary-foreground/60 leading-none mt-0.5">JEWELS</div>
        </div>
      </a>

      <div className="hidden md:flex items-center gap-10">
        {NAV_LINKS.map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="font-['Raleway'] text-sm tracking-[0.15em] text-foreground/70 hover:text-accent focus-visible:text-accent focus-visible:outline-none transition-colors duration-300 uppercase"
          >
            {item}
          </a>
        ))}
      </div>

      <div className="hidden md:block">
        <a
          href="#contact"
          className="inline-block font-['Raleway'] text-xs tracking-[0.2em] uppercase px-6 py-2.5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
        >
          Book Appointment
        </a>
      </div>

      <button
        className="md:hidden text-foreground"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </motion.nav>
  );
}

export function MobileMenu({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {NAV_LINKS.map((item, i) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="font-['Cinzel'] text-3xl text-foreground/80 hover:text-accent transition-colors"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
            >
              {item}
            </motion.a>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
