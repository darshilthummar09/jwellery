export function DiamondSVG({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="dg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff8e7" stopOpacity="0.95" />
          <stop offset="30%" stopColor="#e8c876" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#c9a84c" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8a6520" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="dg2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#c9a84c" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#5a3e10" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="dg3" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8c876" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fff8e7" stopOpacity="0.5" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Crown facets */}
      <polygon points="50,5 75,35 50,30" fill="url(#dg1)" filter="url(#glow)" />
      <polygon points="50,5 25,35 50,30" fill="url(#dg2)" />
      <polygon points="50,5 75,35 95,35" fill="url(#dg3)" opacity="0.8" />
      <polygon points="50,5 25,35 5,35" fill="url(#dg1)" opacity="0.7" />
      {/* Girdle */}
      <polygon points="5,35 25,35 15,50" fill="url(#dg2)" opacity="0.9" />
      <polygon points="95,35 75,35 85,50" fill="url(#dg1)" opacity="0.9" />
      {/* Pavilion */}
      <polygon points="5,35 15,50 50,95" fill="url(#dg2)" opacity="0.85" />
      <polygon points="95,35 85,50 50,95" fill="url(#dg1)" opacity="0.85" />
      <polygon points="15,50 85,50 50,95" fill="url(#dg3)" opacity="0.9" />
      <polygon points="25,35 75,35 85,50 15,50" fill="url(#dg1)" opacity="0.6" />
      {/* Inner table */}
      <polygon points="25,35 75,35 65,45 35,45" fill="white" opacity="0.3" />
      {/* Star facets */}
      <polygon points="50,30 65,45 50,40" fill="white" opacity="0.4" />
      <polygon points="50,30 35,45 50,40" fill="white" opacity="0.25" />
    </svg>
  );
}

export function GoldText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{
        background: "linear-gradient(135deg, #e8c876, #c9a84c)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

export function SectionRule() {
  return (
    <div className="flex items-center justify-center gap-3 mb-5">
      <div className="h-px w-12 bg-primary/60" />
      <DiamondSVG style={{ width: 20, height: 20 }} />
      <div className="h-px w-12 bg-primary/60" />
    </div>
  );
}

export const goldButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #c9a84c, #e8c876, #c9a84c)",
  boxShadow: "0 0 30px rgba(201,168,76,0.4)",
};
