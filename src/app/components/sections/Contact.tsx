import { useState } from "react";
import { motion } from "motion/react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SectionRule } from "./shared";

const CONTACT_CARDS = [
  { icon: <MapPin size={20} />, title: "Our Address", info: "42, Diamond Plaza, Zaveri Bazaar\nMumbai, Maharashtra 400002" },
  { icon: <Phone size={20} />, title: "Call Us", info: "+91 22 4567 8900\n+91 98200 12345" },
  { icon: <Mail size={20} />, title: "Email Us", info: "hello@dreamjewels.in\nbespoke@dreamjewels.in" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function AppointmentForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setStatus("error");
      return;
    }
    setStatus("success");
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border border-primary/40 bg-card/60"
      >
        <div className="font-['Cinzel'] text-lg text-accent mb-2">Thank You</div>
        <p className="font-['Raleway'] text-sm text-muted-foreground">
          Our concierge will reach out to <span className="text-foreground">{email.trim()}</span> within 24 hours to arrange your private viewing.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Your email address"
          aria-label="Your email address"
          aria-invalid={status === "error"}
          className="flex-1 px-5 py-3 bg-card text-foreground placeholder:text-muted-foreground font-['Raleway'] text-sm focus:outline-none transition-colors border"
          style={{ borderColor: status === "error" ? "rgba(212,24,61,0.7)" : undefined }}
        />
        <button
          type="submit"
          className="px-8 py-3 font-['Raleway'] text-sm tracking-[0.15em] uppercase text-primary-foreground flex-shrink-0 hover:opacity-90 active:scale-[0.97] transition-all"
          style={{ background: "linear-gradient(135deg, #c9a84c, #e8c876)" }}
        >
          Reserve
        </button>
      </div>
      {status === "error" && (
        <p className="font-['Raleway'] text-xs text-destructive mt-3 text-left" role="alert">
          Please enter a valid email address so our concierge can reach you.
        </p>
      )}
    </form>
  );
}

export function ContactSection() {
  return (
    <section id="contact" className="py-28 px-6 border-t border-border scroll-mt-20" style={{ background: "linear-gradient(180deg, #0a0608 0%, #110d0f 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <SectionRule />
          <h2 className="font-['Cinzel'] text-5xl font-normal text-foreground mb-4">Visit Our Atelier</h2>
          <p className="font-['Playfair_Display'] italic text-lg text-muted-foreground">We invite you to experience our collection in person</p>
          <p className="font-['Raleway'] text-xs tracking-[0.2em] uppercase text-muted-foreground mt-4 flex items-center justify-center gap-2">
            <Clock size={14} className="text-primary" /> Open Monday – Saturday · 10:30 AM – 8:30 PM
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {CONTACT_CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              className="p-8 border border-border bg-card/40 text-center group hover:border-primary/50 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <div className="flex justify-center mb-4 text-primary">{c.icon}</div>
              <div className="font-['Cinzel'] text-base text-accent mb-3">{c.title}</div>
              <div className="font-['Raleway'] text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{c.info}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="max-w-xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h3 className="font-['Cinzel'] text-2xl text-foreground mb-6">Reserve Your Appointment</h3>
          <AppointmentForm />
        </motion.div>
      </div>
    </section>
  );
}
