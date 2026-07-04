import { motion } from "motion/react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { DiamondSVG, GoldText, goldButtonStyle } from "./shared";

const BESPOKE_STEPS = [
  "Personal consultation with our head designer",
  "3D rendering preview before fabrication",
  "Conflict-free, certified diamond sourcing",
  "Lifetime polishing and care guarantee",
];

export function BespokeSection() {
  return (
    <section id="bespoke" className="py-28 px-6 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <div className="aspect-square overflow-hidden bg-muted">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=800&fit=crop&auto=format"
                alt="Master jeweler crafting a bespoke diamond ring"
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30" />
            </div>
            <div
              className="absolute -bottom-6 -right-6 p-6 bg-card border border-border hidden md:block"
              style={{ boxShadow: "0 0 40px rgba(201,168,76,0.15)" }}
            >
              <DiamondSVG style={{ width: 48, height: 48 }} />
              <div className="font-['Cinzel'] text-sm text-accent mt-2">Bespoke</div>
              <div className="font-['Raleway'] text-xs text-muted-foreground tracking-widest">CRAFTSMANSHIP</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-primary/60" />
              <span className="font-['Raleway'] text-xs tracking-[0.35em] text-primary uppercase">Bespoke Service</span>
            </div>
            <h2 className="font-['Cinzel'] text-4xl md:text-5xl font-normal text-foreground mb-6 leading-tight">
              Your Vision,<br />
              <GoldText>Masterfully Realized</GoldText>
            </h2>
            <p className="font-['Playfair_Display'] italic text-lg text-muted-foreground mb-8 leading-relaxed">
              Bring us your dream and we will make it tangible. Our master craftsmen work with you from initial sketch to final polish, creating a one-of-a-kind treasure that belongs to no one else in the world.
            </p>

            {BESPOKE_STEPS.map((step, i) => (
              <div key={step} className="flex items-start gap-4 mb-5">
                <div
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-['Cinzel'] text-xs"
                  style={{ background: "linear-gradient(135deg, #c9a84c, #e8c876)", color: "#0a0608" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <span className="font-['Raleway'] text-sm text-foreground/70 tracking-wide pt-1.5">{step}</span>
              </div>
            ))}

            <a
              href="#contact"
              className="mt-8 inline-block px-10 py-4 font-['Raleway'] text-sm tracking-[0.25em] uppercase text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-[0.97]"
              style={goldButtonStyle}
            >
              Begin Your Journey
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
