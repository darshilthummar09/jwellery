import { motion } from "motion/react";
import { COLLECTIONS } from "../../data/site";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { DiamondSVG, GoldText, SectionRule } from "./shared";

export function CollectionsSection() {
  return (
    <section id="collections" className="py-28 px-6 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <SectionRule />
          <h2 className="font-['Cinzel'] text-5xl md:text-6xl font-normal text-foreground mb-5">Signature Collections</h2>
          <p className="font-['Playfair_Display'] italic text-lg text-muted-foreground max-w-xl mx-auto">
            Each piece a testament to nature&apos;s most perfect creation — sculpted by master artisans into wearable poetry.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLLECTIONS.map((item, i) => (
            <motion.div
              key={item.id}
              className="group relative cursor-pointer"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
            >
              <div className="relative overflow-hidden bg-card transition-shadow duration-500 group-hover:shadow-[0_0_40px_rgba(201,168,76,0.25)]">
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={item.img}
                    alt={`${item.name} — ${item.category.toLowerCase()}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>

                <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/60 transition-colors duration-300 pointer-events-none" />

                <div className="absolute top-4 right-4 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                  <DiamondSVG style={{ width: 28, height: 28 }} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="font-['Raleway'] text-xs tracking-[0.2em] text-primary uppercase mb-1">{item.category}</div>
                  <div className="font-['Cinzel'] text-xl text-foreground mb-1">{item.name}</div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="font-['Raleway'] text-xs text-muted-foreground">{item.carats} · {item.cut}</div>
                    <div className="font-['Cinzel'] text-base">
                      <GoldText>{item.price}</GoldText>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <a
            href="#contact"
            className="inline-block font-['Raleway'] text-sm tracking-[0.25em] uppercase px-12 py-4 border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300"
          >
            View All Collections
          </a>
        </motion.div>
      </div>
    </section>
  );
}
