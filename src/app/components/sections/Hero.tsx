import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ChevronDown } from "lucide-react";
import { DiamondSVG, goldButtonStyle } from "./shared";

function FloatingDiamond({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        y: [0, -20, 0],
        rotate: [0, 15, -10, 0],
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <DiamondSVG style={{ width: size, height: size }} />
    </motion.div>
  );
}

function SparkleParticle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        scale: [0, 1.2, 0],
        opacity: [0, 1, 0],
        rotate: [0, 180],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3 + 1,
        ease: "easeInOut",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M6 0L6.8 5.2L12 6L6.8 6.8L6 12L5.2 6.8L0 6L5.2 5.2Z" fill="#e8c876" />
      </svg>
    </motion.div>
  );
}

const FLOATING_DIAMONDS = [
  { x: 8, y: 15, size: 55, delay: 0, duration: 6 },
  { x: 88, y: 20, size: 40, delay: 1.5, duration: 7 },
  { x: 5, y: 65, size: 30, delay: 3, duration: 5.5 },
  { x: 92, y: 60, size: 50, delay: 0.8, duration: 8 },
  { x: 50, y: 5, size: 25, delay: 2, duration: 6.5 },
  { x: 75, y: 80, size: 35, delay: 4, duration: 7 },
  { x: 20, y: 85, size: 28, delay: 1, duration: 6 },
];

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  // Respect prefers-reduced-motion: hold the film on its first frame
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videoRef.current?.pause();
    }
  }, []);

  const [sparkles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * 90 + 5,
      y: Math.random() * 80 + 5,
      delay: i * 0.3,
    }))
  );

  return (
    <section ref={ref} id="top" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background film: jeweler cutting a diamond */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none"
        src="/hero-jeweler.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />

      {/* Radial gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,168,76,0.12)_0%,_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,_rgba(232,200,118,0.08)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,_rgba(201,168,76,0.06)_0%,_transparent_50%)]" />

      {FLOATING_DIAMONDS.map((d, i) => (
        <FloatingDiamond key={i} {...d} />
      ))}

      {sparkles.map((s, i) => (
        <SparkleParticle key={i} {...s} />
      ))}

      <motion.div
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        style={{ y, opacity }}
      >
        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary" />
          <span className="font-['Raleway'] text-xs tracking-[0.4em] text-primary uppercase">Since 1998 · Crafting Dreams</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary" />
        </motion.div>

        <motion.h1
          className="font-['Cinzel'] text-6xl md:text-8xl lg:text-9xl font-normal leading-[0.9] tracking-wide mb-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          <span className="block text-foreground">Dream</span>
          <span
            className="block"
            style={{
              background: "linear-gradient(135deg, #fff8e7 0%, #e8c876 30%, #c9a84c 60%, #e8c876 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Jewels
          </span>
        </motion.h1>

        <motion.p
          className="font-['Playfair_Display'] italic text-xl md:text-2xl text-foreground/60 mb-12 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          Where every diamond tells a story of eternal love, and every piece is born from the finest traditions of Indian craftsmanship.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
        >
          <a
            href="#collections"
            className="px-10 py-4 font-['Raleway'] text-sm tracking-[0.25em] uppercase text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-[0.97]"
            style={goldButtonStyle}
          >
            Explore Collections
          </a>
          <a
            href="#heritage"
            className="px-10 py-4 font-['Raleway'] text-sm tracking-[0.25em] uppercase text-accent border border-accent/40 hover:border-accent hover:bg-accent/10 active:scale-[0.97] transition-all duration-300"
          >
            Our Legacy
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-10 flex flex-col items-center gap-2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-['Raleway'] text-xs tracking-[0.3em] text-foreground/30 uppercase">Discover</span>
        <ChevronDown size={16} className="text-primary/60" />
      </motion.div>
    </section>
  );
}
