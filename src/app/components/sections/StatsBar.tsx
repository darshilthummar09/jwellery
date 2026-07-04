import { motion } from "motion/react";
import { STATS } from "../../data/site";
import { GoldText } from "./shared";

export function StatsBar() {
  return (
    <section className="py-12 border-y border-border bg-card/50">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
          >
            <div className="font-['Cinzel'] text-4xl font-semibold mb-1">
              <GoldText>{s.value}</GoldText>
            </div>
            <div className="font-['Raleway'] text-xs tracking-[0.2em] text-muted-foreground uppercase">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
