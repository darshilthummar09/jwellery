import { Instagram, Facebook, Twitter } from "lucide-react";
import { NAV_LINKS } from "../../data/site";
import { DiamondSVG } from "./shared";

const SOCIALS = [
  { icon: Instagram, label: "Instagram" },
  { icon: Facebook, label: "Facebook" },
  { icon: Twitter, label: "Twitter" },
];

export function Footer() {
  return (
    <footer className="pt-14 pb-8 px-6 border-t border-border bg-card/20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 mb-10">
          <div className="flex items-center gap-3">
            <DiamondSVG style={{ width: 24, height: 24 }} />
            <div>
              <div className="font-['Cinzel'] text-sm tracking-widest text-accent">Dream Jewels</div>
              <div className="font-['Raleway'] text-xs tracking-[0.3em] text-muted-foreground">Est. 1998 · Mumbai</div>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3" aria-label="Footer">
            {NAV_LINKS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="font-['Raleway'] text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-accent transition-colors duration-300"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex gap-4">
            {SOCIALS.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#top"
                aria-label={label}
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="font-['Raleway'] text-xs tracking-wide text-muted-foreground text-center">
            © 2026 Dream Jewels. All rights reserved.
          </div>
          <div className="font-['Raleway'] text-xs tracking-wide text-muted-foreground text-center">
            All diamonds are conflict-free · GIA &amp; IGI certified · BIS hallmarked gold
          </div>
        </div>
      </div>
    </footer>
  );
}
