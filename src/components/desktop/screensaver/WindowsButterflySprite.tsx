// jb7572_2026-09-03: Windows Four-Squares Butterfly Vector Sprite
// Distinctive 4-colored Windows icon wings with 3D fluttering cycle, particle glow, and cheeky expressions

import React from 'react';

interface WindowsButterflySpriteProps {
  flapPhase: number; // 0 to 1 cycle for wing flapping
  angle?: number; // Heading angle in degrees
  scale?: number;
  isDodging?: boolean;
}

export const WindowsButterflySprite: React.FC<WindowsButterflySpriteProps> = ({
  flapPhase,
  angle = 0,
  scale = 1,
  isDodging = false
}) => {
  // Flap calculation: Wing angle compresses from open (1) to folded (0.15)
  // Sinusoidal flap gives realistic flutter
  const flapCycle = Math.sin(flapPhase * Math.PI * 2);
  const wingScaleX = 0.2 + Math.abs(flapCycle) * 0.8; // 0.2 when folded, 1.0 when open
  const wingYOffset = flapCycle * 3;

  return (
    <div
      className="relative inline-block select-none pointer-events-none transition-transform duration-75"
      style={{
        transform: `rotate(${angle}deg) scale(${scale})`,
        transformOrigin: 'center center',
        filter: isDodging 
          ? 'drop-shadow(0 0 16px rgba(255, 185, 0, 0.9))' 
          : 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45))'
      }}
    >
      <svg
        width="80"
        height="70"
        viewBox="-40 -35 80 70"
        className="overflow-visible"
      >
        <defs>
          {/* Subtle 3D Sheen on Windows Square Wings */}
          <linearGradient id="winRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff7043" />
            <stop offset="60%" stopColor="#f25022" />
            <stop offset="100%" stopColor="#d83b01" />
          </linearGradient>

          <linearGradient id="winGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a4d436" />
            <stop offset="60%" stopColor="#7fba00" />
            <stop offset="100%" stopColor="#689f00" />
          </linearGradient>

          <linearGradient id="winBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#40c4ff" />
            <stop offset="60%" stopColor="#00a4ef" />
            <stop offset="100%" stopColor="#0078d4" />
          </linearGradient>

          <linearGradient id="winYellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe082" />
            <stop offset="60%" stopColor="#ffb900" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <radialGradient id="butterflyBodyGrad" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="60%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        {/* 1. Glowing Halo when flapping fast or dodging */}
        <ellipse
          cx="0"
          cy="0"
          rx="32"
          ry="26"
          fill="none"
          stroke={isDodging ? '#facc15' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity={0.5 + Math.abs(flapCycle) * 0.4}
        />

        {/* 2. LEFT WINGS (Red top-left, Blue bottom-left) */}
        <g transform={`translate(-3, ${wingYOffset}) scale(${wingScaleX}, 1)`}>
          {/* Top-Left Wing: RED Square */}
          <g transform="translate(-16, -16)">
            <rect
              x="0"
              y="0"
              width="14"
              height="14"
              rx="2.5"
              fill="url(#winRedGrad)"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeOpacity="0.8"
            />
            {/* Wing highlight gloss */}
            <path
              d="M 2 2 L 12 2 L 2 12 Z"
              fill="#ffffff"
              fillOpacity="0.25"
            />
          </g>

          {/* Bottom-Left Wing: BLUE Square */}
          <g transform="translate(-16, 2)">
            <rect
              x="0"
              y="0"
              width="14"
              height="14"
              rx="2.5"
              fill="url(#winBlueGrad)"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeOpacity="0.8"
            />
            {/* Wing highlight gloss */}
            <path
              d="M 2 2 L 12 2 L 2 12 Z"
              fill="#ffffff"
              fillOpacity="0.25"
            />
          </g>
        </g>

        {/* 3. RIGHT WINGS (Green top-right, Yellow bottom-right) */}
        <g transform={`translate(3, ${wingYOffset}) scale(${wingScaleX}, 1)`}>
          {/* Top-Right Wing: GREEN Square */}
          <g transform="translate(2, -16)">
            <rect
              x="0"
              y="0"
              width="14"
              height="14"
              rx="2.5"
              fill="url(#winGreenGrad)"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeOpacity="0.8"
            />
            <path
              d="M 2 2 L 12 2 L 2 12 Z"
              fill="#ffffff"
              fillOpacity="0.25"
            />
          </g>

          {/* Bottom-Right Wing: YELLOW Square */}
          <g transform="translate(2, 2)">
            <rect
              x="0"
              y="0"
              width="14"
              height="14"
              rx="2.5"
              fill="url(#winYellowGrad)"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeOpacity="0.8"
            />
            <path
              d="M 2 2 L 12 2 L 2 12 Z"
              fill="#ffffff"
              fillOpacity="0.25"
            />
          </g>
        </g>

        {/* 4. BUTTERFLY BODY & HEAD (Center) */}
        <g transform="translate(0, 0)">
          {/* Slender Abdomen */}
          <ellipse
            cx="0"
            cy="4"
            rx="2.8"
            ry="9"
            fill="url(#butterflyBodyGrad)"
            stroke="#1e293b"
            strokeWidth="0.75"
          />

          {/* Thorax */}
          <ellipse
            cx="0"
            cy="-6"
            rx="3.2"
            ry="4.5"
            fill="url(#butterflyBodyGrad)"
            stroke="#1e293b"
            strokeWidth="0.75"
          />

          {/* Head */}
          <circle
            cx="0"
            cy="-13"
            r="3.5"
            fill="url(#butterflyBodyGrad)"
            stroke="#0f172a"
            strokeWidth="0.75"
          />

          {/* Cute Little Eyes */}
          <circle cx="-1.4" cy="-14" r="1.1" fill="#38bdf8" />
          <circle cx="1.4" cy="-14" r="1.1" fill="#38bdf8" />
          <circle cx="-1.2" cy="-14.2" r="0.4" fill="#ffffff" />
          <circle cx="1.6" cy="-14.2" r="0.4" fill="#ffffff" />

          {/* Left Antenna */}
          <path
            d="M -1.5 -16 C -5 -22, -10 -25, -12 -23 C -14 -21, -12 -18, -10 -19"
            fill="none"
            stroke="#334155"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Left Antenna Golden Orb */}
          <circle cx="-11" cy="-21" r="1.5" fill="#facc15" />

          {/* Right Antenna */}
          <path
            d="M 1.5 -16 C 5 -22, 10 -25, 12 -23 C 14 -21, 12 -18, 10 -19"
            fill="none"
            stroke="#334155"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Right Antenna Golden Orb */}
          <circle cx="11" cy="-21" r="1.5" fill="#facc15" />
        </g>
      </svg>
    </div>
  );
};
