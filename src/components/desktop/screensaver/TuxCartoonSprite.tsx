// jb7572_2026-09-03: Tux Cartoon Penguin Vector Sprite with Fly Swatter & Net on Pole
// High-fidelity vector animated SVG sprite featuring expressive eyes, running waddle, and swappable tools

import React from 'react';

export type TuxTool = 'swatter' | 'net' | 'both' | 'none';
export type TuxAction = 'running' | 'swatting' | 'netting' | 'skidding' | 'celebrating' | 'tripping' | 'switching';

interface TuxCartoonSpriteProps {
  tool: TuxTool;
  action: TuxAction;
  facingRight: boolean;
  runCycle: number; // 0 to 1 loop for waddle
  actionProgress: number; // 0 to 1 for swat/net swing animation
  targetAngle?: number; // angle toward butterfly in radians
  scale?: number;
}

export const TuxCartoonSprite: React.FC<TuxCartoonSpriteProps> = ({
  tool,
  action,
  facingRight,
  runCycle,
  actionProgress,
  targetAngle = 0,
  scale = 1
}) => {
  // Trigonometric cycles for legs, body bounce, and wings
  const waddlePhase = Math.sin(runCycle * Math.PI * 2);
  const bouncePhase = Math.abs(Math.cos(runCycle * Math.PI * 2));
  const legCycle = Math.sin(runCycle * Math.PI * 2);

  // Dynamic pupil offset tracking the target
  const pupilAngle = facingRight ? targetAngle : Math.PI - targetAngle;
  const pupilDist = 3.5;
  const pupilX = Math.cos(pupilAngle) * pupilDist;
  const pupilY = Math.sin(pupilAngle) * pupilDist;

  // Body tilt based on action and run speed
  let bodyRotate = 0;
  let bodyYOffset = 0;

  if (action === 'running') {
    bodyRotate = waddlePhase * 8 + (facingRight ? 12 : -12); // leaning forward
    bodyYOffset = -bouncePhase * 9;
  } else if (action === 'swatting') {
    // Windup then big forward slam
    if (actionProgress < 0.35) {
      bodyRotate = facingRight ? -18 : 18; // lean back to wind up
      bodyYOffset = 4;
    } else {
      const slamProgress = (actionProgress - 0.35) / 0.65;
      bodyRotate = (facingRight ? 26 : -26) * (1 - slamProgress * 0.4); // lunging forward slam
      bodyYOffset = 6;
    }
  } else if (action === 'netting') {
    // Big sweeping lunge forward
    if (actionProgress < 0.4) {
      bodyRotate = facingRight ? -12 : 12;
      bodyYOffset = 2;
    } else {
      bodyRotate = facingRight ? 22 : -22;
      bodyYOffset = -4;
    }
  } else if (action === 'skidding') {
    bodyRotate = facingRight ? -25 : 25; // leaning backward hard to stop
    bodyYOffset = 5;
  } else if (action === 'celebrating') {
    bodyRotate = Math.sin(runCycle * Math.PI * 4) * 12;
    bodyYOffset = -Math.abs(Math.sin(runCycle * Math.PI * 4)) * 14;
  } else if (action === 'tripping') {
    bodyRotate = facingRight ? 60 : -60;
    bodyYOffset = 18;
  }

  // Left and right leg rotations
  const leftLegRot = action === 'running' ? legCycle * 28 : action === 'skidding' ? 25 : 0;
  const rightLegRot = action === 'running' ? -legCycle * 28 : action === 'skidding' ? -20 : 0;

  // Calculate Tool Swing Transforms
  let toolRotation = -20;
  let toolTranslateX = 0;
  let toolTranslateY = 0;

  if (action === 'swatting') {
    if (actionProgress < 0.3) {
      // Wind up backward
      toolRotation = -75 * (actionProgress / 0.3);
      toolTranslateY = -10;
    } else {
      // Powerful slap down forward
      const slapPhase = Math.min(1, (actionProgress - 0.3) / 0.35);
      toolRotation = -75 + slapPhase * 165; // from -75 deg to +90 deg slam
      toolTranslateX = slapPhase * 15;
      toolTranslateY = slapPhase * 12;
    }
  } else if (action === 'netting') {
    if (actionProgress < 0.3) {
      // Raise net up and back
      toolRotation = -60 * (actionProgress / 0.3);
      toolTranslateY = -8;
    } else {
      // Scoop forward in an arc
      const scoopPhase = Math.min(1, (actionProgress - 0.3) / 0.4);
      toolRotation = -60 + scoopPhase * 140; // forward scoop arc
      toolTranslateX = scoopPhase * 25;
      toolTranslateY = scoopPhase * 8;
    }
  } else if (action === 'running') {
    // Tool bounces rhythmically with run
    toolRotation = -25 + Math.sin(runCycle * Math.PI * 2) * 14;
  }

  return (
    <div
      className="relative inline-block transition-transform duration-75 select-none"
      style={{
        transform: `scaleX(${facingRight ? 1 : -1}) scale(${scale})`,
        transformOrigin: 'center bottom'
      }}
    >
      <svg
        width="160"
        height="160"
        viewBox="-80 -120 160 160"
        className="overflow-visible"
        style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))' }}
      >
        <defs>
          {/* Penguin Black Sheen Gradient */}
          <linearGradient id="tuxBlackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c2c34" />
            <stop offset="35%" stopColor="#18181e" />
            <stop offset="100%" stopColor="#0b0b0e" />
          </linearGradient>

          {/* White Belly Cream Gradient */}
          <linearGradient id="tuxBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="85%" stopColor="#f4f4fa" />
            <stop offset="100%" stopColor="#e2e3ed" />
          </linearGradient>

          {/* Beak & Feet Golden Gradient */}
          <linearGradient id="tuxGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffb703" />
            <stop offset="60%" stopColor="#fb8500" />
            <stop offset="100%" stopColor="#d95a00" />
          </linearGradient>

          {/* Fly Swatter Mesh Pattern */}
          <pattern id="swatterMesh" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 0 2 L 4 2 M 2 0 L 2 4" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.85" />
          </pattern>

          {/* Net Mesh Pattern */}
          <pattern id="netMesh" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 5 5 M 5 0 L 0 5" stroke="#ffffff" strokeWidth="0.65" strokeOpacity="0.7" />
          </pattern>
        </defs>

        {/* 1. Ground Shadow */}
        <ellipse
          cx="0"
          cy="20"
          rx={34 + bouncePhase * 4}
          ry={10 - bouncePhase * 2}
          fill="rgba(0,0,0,0.3)"
          className="transition-all duration-75"
        />

        {/* 2. Feet (Behind or under body) */}
        {/* Left Foot */}
        <g transform={`translate(-14, 14) rotate(${leftLegRot})`}>
          <ellipse cx="6" cy="3" rx="14" ry="6" fill="url(#tuxGoldGrad)" stroke="#c45000" strokeWidth="1" />
          {/* Toe separators */}
          <path d="M 12 1 L 18 3 M 13 4 L 17 6" stroke="#c45000" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* Right Foot */}
        <g transform={`translate(12, 14) rotate(${rightLegRot})`}>
          <ellipse cx="6" cy="3" rx="14" ry="6" fill="url(#tuxGoldGrad)" stroke="#c45000" strokeWidth="1" />
          <path d="M 12 1 L 18 3 M 13 4 L 17 6" stroke="#c45000" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* 3. Main Torso & Head Container with Waddle / Tilt / Bounce */}
        <g transform={`translate(0, ${bodyYOffset}) rotate(${bodyRotate})`}>
          
          {/* Back Left Wing (Behind Body) */}
          <g transform={`translate(-26, -38) rotate(${action === 'running' ? -waddlePhase * 35 : -15})`}>
            <path
              d="M 0 0 C -12 10, -22 28, -14 42 C -8 50, -2 46, 4 30 Z"
              fill="url(#tuxBlackGrad)"
              stroke="#111"
              strokeWidth="1.5"
            />
          </g>

          {/* Main Black Teardrop Body */}
          <path
            d="M 0 -72
               C -28 -72, -34 -45, -34 -15
               C -34 16, -26 24, 0 24
               C 26 24, 34 16, 34 -15
               C 34 -45, 28 -72, 0 -72 Z"
            fill="url(#tuxBlackGrad)"
            stroke="#0a0a0e"
            strokeWidth="1.5"
          />

          {/* White Belly Oval */}
          <path
            d="M 0 -48
               C -18 -48, -24 -24, -24 3
               C -24 16, -16 20, 0 20
               C 16 20, 24 16, 24 3
               C 24 -24, 18 -48, 0 -48 Z"
            fill="url(#tuxBellyGrad)"
          />

          {/* Head & Face Details */}
          {/* Eyes Container */}
          <g transform="translate(6, -55)">
            {/* Left Eye (White) */}
            <ellipse cx="-11" cy="0" rx="9" ry="12" fill="#ffffff" stroke="#111" strokeWidth="1.2" />
            {/* Left Pupil */}
            <circle
              cx={-11 + Math.max(-4, Math.min(4, pupilX))}
              cy={Math.max(-5, Math.min(5, pupilY))}
              r="4"
              fill="#111111"
            />
            {/* Left Eye Specular Reflection */}
            <circle
              cx={-12 + Math.max(-4, Math.min(4, pupilX))}
              cy={-2 + Math.max(-5, Math.min(5, pupilY))}
              r="1.5"
              fill="#ffffff"
            />

            {/* Right Eye (White) */}
            <ellipse cx="7" cy="0" rx="9" ry="12" fill="#ffffff" stroke="#111" strokeWidth="1.2" />
            {/* Right Pupil */}
            <circle
              cx={7 + Math.max(-4, Math.min(4, pupilX))}
              cy={Math.max(-5, Math.min(5, pupilY))}
              r="4"
              fill="#111111"
            />
            {/* Right Eye Specular Reflection */}
            <circle
              cx={6 + Math.max(-4, Math.min(4, pupilX))}
              cy={-2 + Math.max(-5, Math.min(5, pupilY))}
              r="1.5"
              fill="#ffffff"
            />

            {/* Determined Eyebrows when sprinting/swatting */}
            {(action === 'swatting' || action === 'netting' || action === 'running') && (
              <g stroke="#111" strokeWidth="2.2" strokeLinecap="round">
                <path d="M -18 -12 L -6 -8" />
                <path d="M 14 -12 L 2 -8" />
              </g>
            )}

            {/* Surprised / Dizzy spirals when tripping */}
            {action === 'tripping' && (
              <g stroke="#e11d48" strokeWidth="1.5" fill="none">
                <path d="M -15 -14 L -9 -6 M -9 -14 L -15 -6" />
                <path d="M 3 -14 L 9 -6 M 9 -14 L 3 -6" />
              </g>
            )}
          </g>

          {/* Tux Golden Beak */}
          <g transform="translate(6, -42)">
            {/* Upper Beak */}
            <path
              d="M -10 -4 Q 5 -12 18 -2 Q 22 2 16 7 Q 2 11 -8 6 Z"
              fill="url(#tuxGoldGrad)"
              stroke="#b54300"
              strokeWidth="1.2"
            />
            {/* Lower Beak / Smile */}
            <path
              d="M -6 4 Q 4 11 12 5"
              fill="none"
              stroke="#b54300"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Nostrils */}
            <circle cx="2" cy="-2" r="0.8" fill="#802e00" />
            <circle cx="7" cy="-1" r="0.8" fill="#802e00" />
          </g>

          {/* Front Right Wing (Holding the Chasing Tool!) */}
          <g transform={`translate(22, -32) translate(${toolTranslateX}, ${toolTranslateY}) rotate(${toolRotation})`}>
            {/* Wing Flipper holding handle */}
            <path
              d="M -4 -8 C 8 -12, 22 -4, 26 8 C 28 16, 20 22, 10 16 C 0 10, -4 0, -4 -8 Z"
              fill="url(#tuxBlackGrad)"
              stroke="#0a0a0e"
              strokeWidth="1.2"
            />

            {/* Render Active Chasing Tool */}
            {/* TOOL 1: THE FLY SWATTER */}
            {(tool === 'swatter' || tool === 'both') && (
              <g id="tuxFlySwatter" transform="translate(18, 4) rotate(15)">
                {/* Grip Handle */}
                <rect x="-3" y="10" width="6" height="18" rx="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
                <line x1="-3" y1="16" x2="3" y2="16" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />
                <line x1="-3" y1="22" x2="3" y2="22" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />

                {/* Spring Wire Stem */}
                <path
                  d="M 0 10 L 0 -50"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M -2 -18 L 2 -18 M -2 -28 L 2 -28 M -2 -38 L 2 -38"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Swatter Head (Perforated Colored Plastic Grid) */}
                <g transform="translate(0, -50)">
                  {/* Outer Frame */}
                  <rect
                    x="-18"
                    y="-36"
                    width="36"
                    height="36"
                    rx="6"
                    fill="#06b6d4"
                    fillOpacity="0.4"
                    stroke="#0891b2"
                    strokeWidth="2.5"
                  />
                  {/* Mesh Pattern Fill */}
                  <rect
                    x="-18"
                    y="-36"
                    width="36"
                    height="36"
                    rx="6"
                    fill="url(#swatterMesh)"
                  />
                  {/* Reinforcement Ribs */}
                  <line x1="0" y1="-36" x2="0" y2="0" stroke="#0e7490" strokeWidth="1.5" />
                  <line x1="-18" y1="-18" x2="18" y2="-18" stroke="#0e7490" strokeWidth="1.5" />
                  {/* Corner Rivets */}
                  <circle cx="-14" cy="-32" r="1.5" fill="#ffffff" />
                  <circle cx="14" cy="-32" r="1.5" fill="#ffffff" />
                </g>

                {/* Swat Impact Speed Lines when slamming */}
                {action === 'swatting' && actionProgress > 0.4 && (
                  <g stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity={Math.sin(actionProgress * Math.PI)}>
                    <line x1="-24" y1="-70" x2="-38" y2="-90" />
                    <line x1="0" y1="-95" x2="0" y2="-115" />
                    <line x1="24" y1="-70" x2="38" y2="-90" />
                  </g>
                )}
              </g>
            )}

            {/* TOOL 2: BUTTERFLY NET ON A LONG POLE */}
            {(tool === 'net' || (tool === 'both' && action === 'netting')) && (
              <g id="tuxButterflyNet" transform="translate(16, 6) rotate(20)">
                {/* Long Bamboo / Wooden Pole */}
                <line
                  x1="0"
                  y1="25"
                  x2="0"
                  y2="-90"
                  stroke="#d97706"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Wood Grain & Bamboo Rings */}
                <line x1="-2" y1="-10" x2="2" y2="-10" stroke="#92400e" strokeWidth="1.5" />
                <line x1="-2" y1="-40" x2="2" y2="-40" stroke="#92400e" strokeWidth="1.5" />
                <line x1="-2" y1="-70" x2="2" y2="-70" stroke="#92400e" strokeWidth="1.5" />

                {/* Metal Ferrule Connecting Hoop to Pole */}
                <rect x="-3" y="-95" width="6" height="8" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />

                {/* Net Hoop & Flowing White Billowing Mesh Bag */}
                <g transform="translate(0, -95)">
                  {/* Billowing Net Mesh Bag (Flows backward in the wind!) */}
                  <path
                    d={`M -22 0 
                       C -36 ${30 + Math.sin(runCycle * 10) * 8}, -28 ${65 + Math.cos(runCycle * 8) * 10}, 0 ${75 + Math.sin(runCycle * 6) * 6}
                       C 28 ${65 + Math.cos(runCycle * 8) * 10}, 36 ${30 + Math.sin(runCycle * 10) * 8}, 22 0 Z`}
                    fill="rgba(255, 255, 255, 0.45)"
                    stroke="rgba(255, 255, 255, 0.85)"
                    strokeWidth="1.2"
                  />
                  {/* Net Mesh Texture Pattern Overlay */}
                  <path
                    d={`M -22 0 
                       C -36 ${30 + Math.sin(runCycle * 10) * 8}, -28 ${65 + Math.cos(runCycle * 8) * 10}, 0 ${75 + Math.sin(runCycle * 6) * 6}
                       C 28 ${65 + Math.cos(runCycle * 8) * 10}, 36 ${30 + Math.sin(runCycle * 10) * 8}, 22 0 Z`}
                    fill="url(#netMesh)"
                  />

                  {/* Wire Circular Hoop (in perspective) */}
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="24"
                    ry="7"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="3"
                  />
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="22"
                    ry="6"
                    fill="rgba(255,255,255,0.15)"
                  />
                </g>

                {/* Wind / Net Swoosh trails */}
                {action === 'netting' && (
                  <g stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 3" opacity={0.6}>
                    <path d="M -40 -70 C -60 -50, -60 10, -20 40" fill="none" />
                    <path d="M 40 -70 C 60 -50, 60 10, 20 40" fill="none" />
                  </g>
                )}
              </g>
            )}
          </g>

          {/* Cartoon Sweat Drop when sprinting fast */}
          {action === 'running' && (
            <g transform={`translate(-18, -62) scale(${0.8 + bouncePhase * 0.4})`}>
              <path
                d="M 0 0 C -4 4, -4 10, 0 12 C 4 10, 4 4, 0 0 Z"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="0.8"
                opacity="0.9"
              />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
