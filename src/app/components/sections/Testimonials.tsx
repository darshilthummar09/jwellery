import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { TESTIMONIALS } from "../../data/site";
import { SectionRule } from "./shared";

export function TestimonialsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-28 px-6 bg-card/30">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <SectionRule />
          <h2 className="font-['Cinzel'] text-5xl font-normal text-foreground mb-16">Cherished Memories</h2>
        </motion.div>

        <div className="relative min-h-[220px]">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              className="absolute inset-0 flex flex-col items-center"
              animate={{ opacity: active === i ? 1 : 0, y: active === i ? 0 : 20 }}
              transition={{ duration: 0.6 }}
              style={{ pointerEvents: active === i ? "auto" : "none" }}
            >
              <div className="flex gap-1 mb-6">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} className="text-primary fill-primary" />
                ))}
              </div>
              <blockquote className="font-['Playfair_Display'] italic text-xl md:text-2xl text-foreground/80 leading-relaxed mb-8 max-w-2xl">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <div className="font-['Cinzel'] text-base text-accent">{t.name}</div>
              <div className="font-['Raleway'] text-xs tracking-[0.2em] text-muted-foreground uppercase mt-1">{t.location}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-4">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show testimonial from ${t.name}`}
              aria-current={active === i}
              className="flex items-center justify-center h-11 px-2"
            >
              <span
                className="block transition-all duration-300"
                style={{
                  width: active === i ? 32 : 8,
                  height: 8,
                  background: active === i ? "linear-gradient(135deg, #c9a84c, #e8c876)" : "rgba(201,168,76,0.3)",
                  borderRadius: 4,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
