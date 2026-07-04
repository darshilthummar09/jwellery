import { useState } from "react";
import { motion } from "motion/react";
import { DIAMOND_CUTS } from "../../data/site";
import { GoldText } from "./shared";

export function DiamondShowcase() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-28 overflow-hidden relative" style={{ background: "linear-gradient(180deg, #0a0608 0%, #110d0f 50%, #0a0608 100%)" }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,_rgba(201,168,76,0.08)_0%,_transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-primary/60" />
              <span className="font-['Raleway'] text-xs tracking-[0.35em] text-primary uppercase">The 4C Promise</span>
            </div>
            <h2 className="font-['Cinzel'] text-5xl font-normal text-foreground mb-6 leading-tight">
              Every Diamond,<br />
              <GoldText>Perfectly Chosen</GoldText>
            </h2>
            <p className="font-['Playfair_Display'] italic text-lg text-muted-foreground mb-10 leading-relaxed">
              We source only the finest conflict-free diamonds, certified by GIA and IGI, each evaluated on Cut, Color, Clarity, and Carat with uncompromising standards.
            </p>

            <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Diamond cuts">
              {DIAMOND_CUTS.map((cut, i) => (
                <button
                  key={cut.name}
                  role="tab"
                  aria-selected={activeTab === i}
                  onClick={() => setActiveTab(i)}
                  className="font-['Raleway'] text-xs tracking-[0.1em] uppercase px-4 py-2 transition-all duration-300"
                  style={{
                    background: activeTab === i ? "linear-gradient(135deg, #c9a84c, #e8c876)" : "transparent",
                    color: activeTab === i ? "#0a0608" : "rgba(240,230,211,0.5)",
                    border: activeTab === i ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.2)",
                  }}
                >
                  {cut.name}
                </button>
              ))}
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-6 border border-border bg-card/50"
            >
              <div className="font-['Cinzel'] text-lg text-accent mb-2">{DIAMOND_CUTS[activeTab].name}</div>
              <div className="font-['Playfair_Display'] text-base text-foreground/70 leading-relaxed italic">{DIAMOND_CUTS[activeTab].description}</div>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)",
                  width: 400,
                  height: 400,
                  top: -50,
                  left: -50,
                }}
              />

              {/* Floating 3D diamond render */}
              <motion.div
                style={{ width: 300, height: 300 }}
                animate={{ y: [0, -16, 0], rotate: [-3, 3, -3], scale: [1, 1.04, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="/diamond-3d.webp"
                  alt="Brilliant-cut blue diamond"
                  width={300}
                  height={300}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                  style={{
                    filter:
                      "drop-shadow(0 0 50px rgba(130,170,255,0.5)) drop-shadow(0 0 110px rgba(160,195,255,0.25))",
                  }}
                />
              </motion.div>

              {[0, 90, 180, 270].map((deg, i) => (
                <motion.div
                  key={deg}
                  className="absolute"
                  style={{ top: "50%", left: "50%", width: 8, height: 8 }}
                  animate={{ rotate: [deg, deg + 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                >
                  <motion.div
                    style={{ transform: "translateX(160px) translateY(-50%)" }}
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8">
                      <path d="M4 0L4.5 3.5L8 4L4.5 4.5L4 8L3.5 4.5L0 4L3.5 3.5Z" fill="#e8c876" />
                    </svg>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
