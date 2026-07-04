import { motion } from "motion/react";
import { OCCASIONS } from "../../data/site";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { SectionRule } from "./shared";

export function OccasionsSection() {
  return (
    <section id="occasions" className="py-28 px-6 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <SectionRule />
          <h2 className="font-['Cinzel'] text-5xl md:text-6xl font-normal text-foreground mb-5">For Every Occasion</h2>
          <p className="font-['Playfair_Display'] italic text-lg text-muted-foreground max-w-xl mx-auto">
            Life&apos;s milestones deserve more than a gift — they deserve an heirloom.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {OCCASIONS.map((o, i) => (
            <motion.a
              href="#contact"
              key={o.title}
              className="group relative block overflow-hidden bg-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
            >
              <div className="aspect-[3/4] overflow-hidden bg-muted">
                <ImageWithFallback
                  src={o.img}
                  alt={o.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/50 transition-colors duration-300 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                <div className="font-['Cinzel'] text-2xl text-foreground mb-1">{o.title}</div>
                <div className="font-['Playfair_Display'] italic text-sm text-foreground/60">{o.tagline}</div>
                <div className="font-['Raleway'] text-xs tracking-[0.25em] uppercase text-primary mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Enquire →
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
