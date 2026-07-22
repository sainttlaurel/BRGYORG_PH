import React from "react";

const HeroLandscape: React.FC = () => {
  return (
    <svg
      viewBox="0 0 900 500"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="hl-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="45%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
        <linearGradient id="hl-mt" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a3a2a" />
          <stop offset="100%" stopColor="#0f2d1e" />
        </linearGradient>
        <linearGradient id="hl-h1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#14532d" />
          <stop offset="100%" stopColor="#052e16" />
        </linearGradient>
        <linearGradient id="hl-h2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
        <linearGradient id="hl-fg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="hl-river" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="hl-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="55%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fbbf24" />
        </radialGradient>
        <radialGradient id="hl-sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <filter id="hl-blur">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Sky */}
      <rect width="900" height="500" fill="url(#hl-sky)" />

      {/* Sun halo */}
      <circle cx="760" cy="90" r="72" fill="url(#hl-sun-glow)" filter="url(#hl-blur)" />
      {/* Sun */}
      <circle cx="760" cy="90" r="32" fill="url(#hl-sun)" />

      {/* Clouds */}
      <g opacity="0.88">
        <ellipse cx="130" cy="100" rx="80" ry="26" fill="white" />
        <ellipse cx="178" cy="86" rx="58" ry="21" fill="white" />
        <ellipse cx="88" cy="94" rx="50" ry="19" fill="#e0f2fe" />
      </g>
      <g opacity="0.72">
        <ellipse cx="460" cy="68" rx="90" ry="24" fill="white" />
        <ellipse cx="514" cy="55" rx="66" ry="20" fill="white" />
        <ellipse cx="412" cy="63" rx="54" ry="17" fill="#e0f2fe" />
      </g>
      <g opacity="0.55">
        <ellipse cx="630" cy="50" rx="60" ry="18" fill="white" />
        <ellipse cx="668" cy="40" rx="44" ry="14" fill="white" />
      </g>

      {/* Far mountains */}
      <path d="M0 240 L80 150 L160 195 L260 110 L370 165 L460 100 L570 155 L670 90 L770 140 L860 80 L900 120 L900 500 L0 500 Z" fill="url(#hl-mt)" opacity="0.55" />

      {/* Middle forest hills */}
      <path d="M0 300 Q80 235 180 265 Q280 295 400 250 Q520 205 620 255 Q720 305 820 245 Q860 225 900 250 L900 500 L0 500 Z" fill="url(#hl-h1)" />

      {/* River winding through valley */}
      <path d="M120 360 Q200 330 280 350 Q360 370 440 330 Q520 290 600 320 Q680 350 760 315 Q820 290 900 310" stroke="url(#hl-river)" strokeWidth="16" fill="none" strokeLinecap="round" />

      {/* Foreground hills */}
      <path d="M0 360 Q100 310 220 340 Q340 370 460 320 Q580 270 700 315 Q800 355 900 300 L900 500 L0 500 Z" fill="url(#hl-h2)" />

      {/* Trees – group left */}
      <g transform="translate(110, 265)">
        <rect x="-4" y="12" width="8" height="18" fill="#7c4a0a" />
        <polygon points="0,-28 -16,12 16,12" fill="#14532d" />
        <polygon points="0,-46 -21,6 21,6" fill="#166534" />
      </g>
      <g transform="translate(145, 252)">
        <rect x="-4" y="12" width="8" height="20" fill="#7c4a0a" />
        <polygon points="0,-34 -19,12 19,12" fill="#14532d" />
        <polygon points="0,-54 -24,6 24,6" fill="#15803d" />
      </g>
      <g transform="translate(178, 270)">
        <rect x="-3" y="10" width="6" height="16" fill="#7c4a0a" />
        <polygon points="0,-24 -13,10 13,10" fill="#166534" />
        <polygon points="0,-40 -17,5 17,5" fill="#14532d" />
      </g>

      {/* Trees – group right */}
      <g transform="translate(620, 248)">
        <rect x="-4" y="12" width="8" height="18" fill="#7c4a0a" />
        <polygon points="0,-32 -17,12 17,12" fill="#14532d" />
        <polygon points="0,-50 -22,6 22,6" fill="#15803d" />
      </g>
      <g transform="translate(660, 238)">
        <rect x="-5" y="12" width="9" height="22" fill="#7c4a0a" />
        <polygon points="0,-36 -20,12 20,12" fill="#14532d" />
        <polygon points="0,-58 -26,6 26,6" fill="#166534" />
      </g>
      <g transform="translate(698, 256)">
        <rect x="-3" y="10" width="7" height="16" fill="#7c4a0a" />
        <polygon points="0,-26 -14,10 14,10" fill="#15803d" />
        <polygon points="0,-42 -18,5 18,5" fill="#14532d" />
      </g>

      {/* Barangay hall silhouette */}
      <g transform="translate(400, 305)" opacity="0.92">
        {/* Flag pole */}
        <line x1="8" y1="-52" x2="8" y2="-72" stroke="#052e16" strokeWidth="2.5" />
        <polygon points="8,-72 22,-65 8,-58" fill="#fbbf24" />
        {/* Main building */}
        <rect x="-38" y="-28" width="76" height="42" fill="#052e16" rx="2" />
        {/* Roof */}
        <polygon points="-44,-28 44,-28 6,-56" fill="#0a1f14" />
        {/* Columns */}
        <rect x="-28" y="-20" width="6" height="34" fill="#065f46" />
        <rect x="-10" y="-20" width="6" height="34" fill="#065f46" />
        <rect x="8" y="-20" width="6" height="34" fill="#065f46" />
        <rect x="26" y="-20" width="6" height="34" fill="#065f46" />
        {/* Door */}
        <rect x="-7" y="-4" width="18" height="18" fill="#065f46" rx="9 9 0 0" />
        {/* Windows */}
        <rect x="-32" y="-14" width="12" height="10" fill="#38bdf8" opacity="0.7" rx="1" />
        <rect x="24" y="-14" width="12" height="10" fill="#38bdf8" opacity="0.7" rx="1" />
      </g>

      {/* Foreground ground cover */}
      <path d="M0 430 Q150 405 300 425 Q450 445 600 415 Q750 385 900 405 L900 500 L0 500 Z" fill="url(#hl-fg)" opacity="0.8" />

      {/* Flowers / small plants foreground */}
      <circle cx="55" cy="448" r="5" fill="#fde68a" />
      <circle cx="72" cy="454" r="3.5" fill="#fecdd3" />
      <circle cx="180" cy="438" r="5" fill="#fde68a" />
      <circle cx="820" cy="422" r="4.5" fill="#fde68a" />
      <circle cx="845" cy="432" r="3" fill="#bbf7d0" />
      <circle cx="870" cy="440" r="5" fill="#fecdd3" />

      {/* Small rice field pattern on foreground */}
      <g opacity="0.4">
        <line x1="300" y1="460" x2="320" y2="445" stroke="#166534" strokeWidth="1.5" />
        <line x1="310" y1="462" x2="330" y2="447" stroke="#166534" strokeWidth="1.5" />
        <line x1="320" y1="460" x2="340" y2="445" stroke="#166534" strokeWidth="1.5" />
        <line x1="330" y1="465" x2="350" y2="450" stroke="#166534" strokeWidth="1.5" />
      </g>
    </svg>
  );
};

export default HeroLandscape;
