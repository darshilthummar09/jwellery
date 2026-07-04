import { motion } from "motion/react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { GoldText } from "./shared";

export function HeritageBanner() {
  return (
    <section id="heritage" className="relative py-0 overflow-hidden scroll-mt-20">
      <div className="relative h-[60vh] min-h-[400px]">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1600&h=900&fit=crop&auto=format"
          alt="Fine jewellery laid out in the atelier"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />

        <div className="relative z-10 h-full flex items-center px-8 md:px-20 max-w-7xl mx-auto">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-primary/60" />
              <span className="font-['Raleway'] text-xs tracking-[0.35em] text-primary uppercase">Our Heritage</span>
            </div>
            <h2 className="font-['Cinzel'] text-4xl md:text-5xl font-normal text-foreground mb-6 leading-tight">
              Three Generations of <br />
              <GoldText>Diamond Mastery</GoldText>
            </h2>
            <p className="font-['Playfair_Display'] italic text-lg text-foreground/70 leading-relaxed mb-8">
              Founded in 1998, Dream Jewels has been the trusted custodian of life&apos;s most precious moments — engagements, anniversaries, and celebrations across generations of Indian families.
            </p>
            <a
              href="#bespoke"
              className="inline-block font-['Raleway'] text-sm tracking-[0.25em] uppercase px-8 py-3"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #e8c876)",
                color: "#0a0608",
              }}
            >
              Our Story
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
