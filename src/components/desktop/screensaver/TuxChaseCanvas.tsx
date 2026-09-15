// jb7572_2026-09-03: Master Cartoon Animation Canvas & Physics Engine
// Orchestrates Tux waddling, running, tool-switching (Fly Swatter / Net on a Pole), and chasing the Windows 4-Squares Butterfly

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TuxCartoonSprite, TuxTool, TuxAction } from './TuxCartoonSprite';
import { WindowsButterflySprite } from './WindowsButterflySprite';
import { cartoonAudio } from './cartoonAudioSynthesizer';

export type SceneryTheme = 'bliss' | 'night' | 'matrix' | 'transparent';
export type ToolSelectionMode = 'auto' | 'swatter' | 'net' | 'both';

interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  rotation: number;
}

interface DustPuff {
  id: number;
  x: number;
  y: number;
  size: number;
  alpha: number;
}

interface ButterflyState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  flapPhase: number;
  angle: number;
  isDodging: boolean;
  dodgeTimer: number;
  hoverTimer: number;
}

interface TuxChaseCanvasProps {
  scenery?: SceneryTheme;
  toolMode?: ToolSelectionMode;
  speedMultiplier?: number; // 0.6 = relaxed, 1.0 = normal, 1.6 = turbo
  butterflyCount?: number; // 1 to 5
  soundEnabled?: boolean;
  interactive?: boolean;
  onStatsUpdate?: (stats: { catches: number; swats: number; netScoops: number; currentTool: string }) => void;
  className?: string;
}

const WIN_COLORS = ['#f25022', '#7fba00', '#00a4ef', '#ffb900'];

export const TuxChaseCanvas: React.FC<TuxChaseCanvasProps> = ({
  scenery = 'bliss',
  toolMode = 'auto',
  speedMultiplier = 1.0,
  butterflyCount = 1,
  soundEnabled = true,
  interactive = true,
  onStatsUpdate,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync sound muted state
  useEffect(() => {
    cartoonAudio.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Tux State
  const tuxRef = useRef({
    x: 150,
    y: 380, // ground level
    vx: 0,
    facingRight: true,
    action: 'running' as TuxAction,
    runCycle: 0,
    actionProgress: 0,
    currentTool: 'swatter' as TuxTool,
    toolSwitchTimer: 0,
    swatCooldown: 0,
    swatsDone: 0,
    stepTimer: 0,
    altFoot: false
  });

  // Butterflies State
  const butterfliesRef = useRef<ButterflyState[]>([]);

  // Particles
  const sparklesRef = useRef<SparkleParticle[]>([]);
  const dustPuffsRef = useRef<DustPuff[]>([]);
  const nextParticleId = useRef(0);

  // Stats
  const statsRef = useRef({
    catches: 0,
    swats: 0,
    netScoops: 0
  });

  // Render State (Driven by requestAnimationFrame)
  const [, setFrameTick] = useState(0);

  // Initialize or resize container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.max(320, rect.width || 800);
        const h = Math.max(240, rect.height || 500);
        setDimensions({ width: w, height: h });
        // Adjust ground line for Tux
        tuxRef.current.y = h * 0.76;
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initialize Butterflies
  useEffect(() => {
    const list: ButterflyState[] = [];
    const count = Math.max(1, Math.min(5, butterflyCount));
    const w = dimensions.width || 800;
    const h = dimensions.height || 500;

    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        x: w * 0.45 + i * 90,
        y: h * 0.35 + Math.sin(i) * 60,
        vx: 1.5,
        vy: 0.5,
        targetX: w * 0.6,
        targetY: h * 0.4,
        flapPhase: i * 0.2,
        angle: 0,
        isDodging: false,
        dodgeTimer: 0,
        hoverTimer: Math.random() * 100
      });
    }
    butterfliesRef.current = list;
  }, [butterflyCount, dimensions.width, dimensions.height]);

  // Tool Mode Sync
  useEffect(() => {
    if (toolMode === 'swatter') {
      tuxRef.current.currentTool = 'swatter';
    } else if (toolMode === 'net') {
      tuxRef.current.currentTool = 'net';
    } else if (toolMode === 'both') {
      tuxRef.current.currentTool = 'both';
    }
  }, [toolMode]);

  // Add dust puff under Tux's feet
  const addDustPuff = (x: number, y: number) => {
    dustPuffsRef.current.push({
      id: nextParticleId.current++,
      x: x + (Math.random() * 10 - 5),
      y: y + 16,
      size: 6 + Math.random() * 6,
      alpha: 0.7
    });
    if (dustPuffsRef.current.length > 25) {
      dustPuffsRef.current.shift();
    }
  };

  // Add sparkle from butterfly wings
  const addSparkle = (x: number, y: number) => {
    const color = WIN_COLORS[Math.floor(Math.random() * WIN_COLORS.length)];
    sparklesRef.current.push({
      id: nextParticleId.current++,
      x: x + (Math.random() * 16 - 8),
      y: y + (Math.random() * 16 - 8),
      vx: (Math.random() - 0.5) * 1.5,
      vy: 0.5 + Math.random() * 1.2,
      color,
      size: 4 + Math.random() * 5,
      alpha: 0.9,
      rotation: Math.random() * 360
    });
    if (sparklesRef.current.length > 40) {
      sparklesRef.current.shift();
    }
  };

  // Click on canvas -> butterfly flutters to click and Tux dashes there!
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.x;
    const clickY = e.clientY - rect.y;

    // Direct first butterfly towards the click
    if (butterfliesRef.current[0]) {
      const b = butterfliesRef.current[0];
      b.targetX = clickX;
      b.targetY = Math.max(60, Math.min(dimensions.height * 0.7, clickY));
      b.isDodging = true;
      b.dodgeTimer = 35;
      cartoonAudio.playButterflyChime();
    }
  };

  // External trigger actions
  const triggerSwat = useCallback(() => {
    const tux = tuxRef.current;
    if (tux.action === 'running') {
      tux.action = 'swatting';
      tux.actionProgress = 0;
      cartoonAudio.playSwatterSwing();
      statsRef.current.swats++;
    }
  }, []);

  const triggerNet = useCallback(() => {
    const tux = tuxRef.current;
    if (tux.action === 'running') {
      tux.action = 'netting';
      tux.actionProgress = 0;
      cartoonAudio.playNetWhoosh();
      statsRef.current.netScoops++;
    }
  }, []);

  const triggerTrip = useCallback(() => {
    const tux = tuxRef.current;
    if (tux.action === 'running') {
      tux.action = 'skidding';
      tux.actionProgress = 0;
      cartoonAudio.playSkidSqueak();
    }
  }, []);

  const triggerToolSwitch = useCallback(() => {
    const tux = tuxRef.current;
    const nextTool: TuxTool = tux.currentTool === 'swatter' ? 'net' : 'swatter';
    tux.currentTool = nextTool;
    cartoonAudio.playToolSwitch();
    // Quick pop effect
    addDustPuff(tux.x, tux.y);
  }, []);

  // Expose triggers to window or parent via ref or attributes
  useEffect(() => {
    (window as any).__tuxScreensaver = {
      triggerSwat,
      triggerNet,
      triggerTrip,
      triggerToolSwitch
    };
    return () => {
      delete (window as any).__tuxScreensaver;
    };
  }, [triggerSwat, triggerNet, triggerTrip, triggerToolSwitch]);

  // Main Animation Physics Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(40, currentTime - lastTime) / 16.66; // Normalized frame delta (~1.0 at 60fps)
      lastTime = currentTime;

      const tux = tuxRef.current;
      const butterflies = butterfliesRef.current;
      const width = dimensions.width;
      const height = dimensions.height;
      const groundY = height * 0.76;

      tux.y = groundY;

      // 1. UPDATE BUTTERFLIES
      const primaryButterfly = butterflies[0];
      butterflies.forEach((b, idx) => {
        // Flap cycle (faster when dodging)
        const flapSpeed = b.isDodging ? 0.14 : 0.08;
        b.flapPhase = (b.flapPhase + flapSpeed * speedMultiplier * dt) % 1;

        // Emit wing sparkle particles
        if (Math.random() < 0.35) {
          addSparkle(b.x, b.y);
        }

        // Wander AI & Target Logic
        b.hoverTimer += 0.03 * dt;
        if (b.dodgeTimer > 0) {
          b.dodgeTimer -= dt;
          if (b.dodgeTimer <= 0) b.isDodging = false;
        }

        // Periodically choose new teasing waypoint
        if (Math.random() < 0.015 && b.dodgeTimer <= 0) {
          // Stay ahead of Tux or tease over his head
          const teaseDist = 140 + Math.random() * 220;
          b.targetX = tux.facingRight 
            ? Math.min(width - 60, tux.x + teaseDist) 
            : Math.max(60, tux.x - teaseDist);
          // If close to wall, flip
          if (b.targetX > width - 80 || b.targetX < 80) {
            b.targetX = width * 0.5 + (Math.random() - 0.5) * (width * 0.5);
          }
          b.targetY = height * 0.25 + Math.sin(b.hoverTimer) * (height * 0.25);
        }

        // Steer toward target with gentle sinusoidal hovering
        const hoverOffsetY = Math.sin(b.hoverTimer * 2 + idx) * 22;
        const dx = b.targetX - b.x;
        const dy = (b.targetY + hoverOffsetY) - b.y;

        const steerSpeed = (b.isDodging ? 0.07 : 0.035) * speedMultiplier;
        b.vx += dx * steerSpeed * 0.05 * dt;
        b.vy += dy * steerSpeed * 0.05 * dt;

        // Apply friction
        b.vx *= 0.94;
        b.vy *= 0.94;

        // Clamp speed
        const maxBSpd = (b.isDodging ? 7.5 : 4.5) * speedMultiplier;
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (spd > maxBSpd) {
          b.vx = (b.vx / spd) * maxBSpd;
          b.vy = (b.vy / spd) * maxBSpd;
        }

        // Move butterfly
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Screen boundary bounce
        if (b.x < 40) { b.x = 40; b.vx = Math.abs(b.vx) * 1.2; }
        if (b.x > width - 40) { b.x = width - 40; b.vx = -Math.abs(b.vx) * 1.2; }
        if (b.y < 40) { b.y = 40; b.vy = Math.abs(b.vy); }
        if (b.y > groundY - 30) { b.y = groundY - 30; b.vy = -Math.abs(b.vy); }

        // Angle tilts with horizontal speed
        b.angle = Math.max(-30, Math.min(30, b.vx * 4));
      });

      // 2. TUX AI & MOVEMENT
      if (primaryButterfly) {
        const distToB = primaryButterfly.x - tux.x;
        const absDist = Math.abs(distToB);

        // Tool auto-switching timer
        if (toolMode === 'auto') {
          tux.toolSwitchTimer += dt;
          if (tux.toolSwitchTimer > 400) { // ~8-10 seconds
            tux.toolSwitchTimer = 0;
            tux.currentTool = tux.currentTool === 'swatter' ? 'net' : 'swatter';
            cartoonAudio.playToolSwitch();
            addDustPuff(tux.x, tux.y);
          }
        }

        // Action States
        if (tux.action === 'running') {
          // Set facing direction
          const targetFacingRight = distToB > 0;
          if (targetFacingRight !== tux.facingRight && absDist > 40) {
            // If running fast and suddenly reverses -> Skid to a halt comically!
            if (Math.abs(tux.vx) > 3.0) {
              tux.action = 'skidding';
              tux.actionProgress = 0;
              cartoonAudio.playSkidSqueak();
              addDustPuff(tux.x, tux.y);
              addDustPuff(tux.x, tux.y);
            } else {
              tux.facingRight = targetFacingRight;
            }
          }

          // Accelerate toward butterfly
          const targetVx = (tux.facingRight ? 1 : -1) * (4.2 * speedMultiplier);
          tux.vx += (targetVx - tux.vx) * 0.08 * dt;
          tux.x += tux.vx * dt;

          // Running leg/waddle cycle
          const runRate = Math.abs(tux.vx) * 0.045;
          tux.runCycle = (tux.runCycle + runRate * dt) % 1;

          // Footstep audio trigger
          tux.stepTimer += Math.abs(tux.vx) * dt;
          if (tux.stepTimer > 18) {
            tux.stepTimer = 0;
            tux.altFoot = !tux.altFoot;
            cartoonAudio.playWaddleStep(tux.altFoot);
            addDustPuff(tux.x, tux.y);
          }

          // Keep within stage
          if (tux.x < 50) { tux.x = 50; tux.vx = 0; }
          if (tux.x > width - 50) { tux.x = width - 50; tux.vx = 0; }

          // Cooldown for attacks
          if (tux.swatCooldown > 0) {
            tux.swatCooldown -= dt;
          } else {
            // If Tux is close enough to the butterfly, ATTEMPT STRIKE!
            // Swatter requires closer distance; Net has longer pole reach!
            const attackDistance = tux.currentTool === 'net' ? 120 : 85;
            if (absDist < attackDistance && Math.abs(primaryButterfly.y - (groundY - 60)) < 110) {
              // Initiate swing!
              if (tux.currentTool === 'swatter') {
                tux.action = 'swatting';
                tux.actionProgress = 0;
                cartoonAudio.playSwatterSwing();
                statsRef.current.swats++;
              } else {
                tux.action = 'netting';
                tux.actionProgress = 0;
                cartoonAudio.playNetWhoosh();
                statsRef.current.netScoops++;
              }
            }
          }
        } else if (tux.action === 'swatting') {
          // Progress swat animation
          tux.actionProgress += 0.035 * speedMultiplier * dt;
          tux.vx *= 0.88;
          tux.x += tux.vx * dt;

          // Slam moment
          if (tux.actionProgress >= 0.55 && tux.actionProgress - 0.035 * speedMultiplier * dt < 0.55) {
            cartoonAudio.playSwatterSlam();
            addDustPuff(tux.x + (tux.facingRight ? 35 : -35), tux.y);

            // Butterfly dodges comically!
            if (primaryButterfly) {
              primaryButterfly.isDodging = true;
              primaryButterfly.dodgeTimer = 40;
              primaryButterfly.vy = -6.5; // darts upwards
              primaryButterfly.vx = (tux.facingRight ? 3.5 : -3.5);
              cartoonAudio.playButterflyChime();
            }
          }

          if (tux.actionProgress >= 1.0) {
            tux.action = 'running';
            tux.swatCooldown = 60; // cooldown
          }
        } else if (tux.action === 'netting') {
          // Progress net scoop animation
          tux.actionProgress += 0.028 * speedMultiplier * dt;
          // Tux lunges forward with the net
          if (tux.actionProgress < 0.6) {
            tux.vx = (tux.facingRight ? 3.0 : -3.0) * speedMultiplier;
            tux.x += tux.vx * dt;
          } else {
            tux.vx *= 0.85;
            tux.x += tux.vx * dt;
          }

          // Scoop peak moment
          if (tux.actionProgress >= 0.5 && tux.actionProgress - 0.028 * speedMultiplier * dt < 0.5) {
            cartoonAudio.playCartoonBoing();
            // Butterfly loops out of reach!
            if (primaryButterfly) {
              primaryButterfly.isDodging = true;
              primaryButterfly.dodgeTimer = 50;
              primaryButterfly.vy = -5.5;
              primaryButterfly.vx = (tux.facingRight ? -4 : 4); // loops over Tux's head
              cartoonAudio.playButterflyChime();
            }
          }

          if (tux.actionProgress >= 1.0) {
            tux.action = 'running';
            tux.swatCooldown = 60;
          }
        } else if (tux.action === 'skidding') {
          tux.actionProgress += 0.05 * dt;
          tux.vx *= 0.82;
          tux.x += tux.vx * dt;
          if (Math.random() < 0.4) {
            addDustPuff(tux.x, tux.y);
          }

          if (tux.actionProgress >= 1.0 || Math.abs(tux.vx) < 0.5) {
            tux.facingRight = !tux.facingRight; // flipped around!
            tux.action = 'running';
            tux.actionProgress = 0;
          }
        }
      }

      // 3. UPDATE PARTICLES
      // Dust
      dustPuffsRef.current.forEach(p => {
        p.alpha -= 0.025 * dt;
        p.size += 0.25 * dt;
      });
      dustPuffsRef.current = dustPuffsRef.current.filter(p => p.alpha > 0);

      // Sparkles
      sparklesRef.current.forEach(s => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 0.04 * dt; // gravity
        s.alpha -= 0.018 * dt;
        s.rotation += 4 * dt;
      });
      sparklesRef.current = sparklesRef.current.filter(s => s.alpha > 0);

      // Report stats update if provided
      if (onStatsUpdate && Math.random() < 0.05) {
        onStatsUpdate({
          catches: statsRef.current.catches,
          swats: statsRef.current.swats,
          netScoops: statsRef.current.netScoops,
          currentTool: tux.currentTool === 'swatter' ? 'Fly Swatter' : tux.currentTool === 'net' ? 'Butterfly Net on Pole' : 'Dual Wield'
        });
      }

      // Trigger re-render
      setFrameTick(currentTime);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [dimensions.width, dimensions.height, speedMultiplier, toolMode, onStatsUpdate]);

  const tux = tuxRef.current;
  const butterflies = butterfliesRef.current;
  const primaryButterfly = butterflies[0];

  // Angle from Tux head to primary butterfly for pupil tracking
  const targetAngle = primaryButterfly
    ? Math.atan2(primaryButterfly.y - (tux.y - 55), primaryButterfly.x - tux.x)
    : 0;

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasClick}
      className={`relative w-full h-full overflow-hidden select-none cursor-pointer ${className}`}
      style={{
        background:
          scenery === 'bliss'
            ? 'linear-gradient(180deg, #38bdf8 0%, #7dd3fc 45%, #bae6fd 65%, #86efac 68%, #22c55e 100%)'
            : scenery === 'night'
            ? 'linear-gradient(180deg, #090a16 0%, #151833 55%, #1e1b4b 75%, #064e3b 100%)'
            : scenery === 'matrix'
            ? 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)'
            : 'transparent'
      }}
    >
      {/* 1. SCENERY BACKGROUND ELEMENTS */}
      {scenery === 'bliss' && (
        <>
          {/* Sunny Warm Glow */}
          <div className="absolute top-6 right-16 w-24 h-24 rounded-full bg-amber-300/80 blur-xl pointer-events-none" />
          <div className="absolute top-8 right-18 w-20 h-20 rounded-full bg-yellow-200/90 shadow-[0_0_40px_rgba(253,224,71,0.8)] pointer-events-none" />

          {/* Drifting Clouds */}
          <div className="absolute top-10 left-[10%] opacity-85 animate-pulse pointer-events-none">
            <svg width="120" height="45" viewBox="0 0 120 45" fill="white">
              <path d="M20,35 a15,15 0 0,1 25,-10 a20,20 0 0,1 35,-5 a18,18 0 0,1 25,15 z" />
            </svg>
          </div>
          <div className="absolute top-20 left-[55%] opacity-70 pointer-events-none">
            <svg width="140" height="50" viewBox="0 0 140 50" fill="white">
              <path d="M25,40 a18,18 0 0,1 30,-12 a24,24 0 0,1 42,-6 a20,20 0 0,1 30,18 z" />
            </svg>
          </div>

          {/* Rolling Hills Curves */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none">
            <svg
              viewBox="0 0 1200 320"
              preserveAspectRatio="none"
              className="w-full h-44 text-emerald-600/40 fill-current"
            >
              <path d="M0,160 C300,90 600,240 1200,120 L1200,320 L0,320 Z" />
            </svg>
            <svg
              viewBox="0 0 1200 320"
              preserveAspectRatio="none"
              className="w-full h-36 -mt-16 text-emerald-500 fill-current"
            >
              <path d="M0,190 C400,110 800,220 1200,150 L1200,320 L0,320 Z" />
            </svg>
          </div>

          {/* Swaying Meadow Daisies */}
          <div className="absolute bottom-4 left-12 flex gap-12 text-white/90 text-sm pointer-events-none">
            <span>🌼</span>
            <span>🌸</span>
            <span>🌼</span>
          </div>
          <div className="absolute bottom-5 right-20 flex gap-14 text-white/90 text-sm pointer-events-none">
            <span>🌸</span>
            <span>🌼</span>
            <span>🌸</span>
          </div>
        </>
      )}

      {scenery === 'night' && (
        <>
          {/* Crescent Moon */}
          <div className="absolute top-8 right-16 text-amber-200 text-4xl drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] pointer-events-none">
            🌙
          </div>

          {/* Twinkling Stars */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white animate-ping"
                style={{
                  top: `${(i * 19) % 65}%`,
                  left: `${(i * 37) % 95}%`,
                  width: `${(i % 3) + 1.5}px`,
                  height: `${(i % 3) + 1.5}px`,
                  animationDuration: `${2 + (i % 4)}s`,
                  opacity: 0.6 + (i % 4) * 0.1
                }}
              />
            ))}
          </div>

          {/* Soft Night Meadow Silhouette */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none">
            <svg
              viewBox="0 0 1200 320"
              preserveAspectRatio="none"
              className="w-full h-36 text-[#042f24] fill-current"
            >
              <path d="M0,180 C350,110 750,220 1200,140 L1200,320 L0,320 Z" />
            </svg>
          </div>
        </>
      )}

      {scenery === 'matrix' && (
        <>
          {/* Cyber Perspective Grid Floor */}
          <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(to_bottom,transparent,rgba(16,185,129,0.1))] border-t border-emerald-500/30 overflow-hidden pointer-events-none">
            <div className="w-full h-full [background-image:linear-gradient(to_right,rgba(16,185,129,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.2)_1px,transparent_1px)] [background-size:32px_32px] [transform:perspective(300px)_rotateX(60deg)] origin-bottom" />
          </div>
          {/* Floating Memory / Code Rain Elements */}
          <div className="absolute top-4 left-6 font-mono text-[10px] text-emerald-400/40 pointer-events-none">
            0x7FFF_SYS_KERNEL // TUX_VECT_INTERRUPT 0x80
          </div>
        </>
      )}

      {/* 2. DUST PUFFS UNDER TUX'S FEET */}
      {dustPuffsRef.current.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white/70 pointer-events-none transition-transform"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.alpha,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* 3. WING SPARKLES BEHIND BUTTERFLY */}
      {sparklesRef.current.map(s => (
        <div
          key={s.id}
          className="absolute pointer-events-none rounded-xs shadow-sm"
          style={{
            left: `${s.x}px`,
            top: `${s.y}px`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            opacity: s.alpha,
            transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
            boxShadow: `0 0 6px ${s.color}`
          }}
        />
      ))}

      {/* 4. TUX THE PENGUIN SPRITE */}
      <div
        className="absolute transition-transform duration-75 pointer-events-none"
        style={{
          left: `${tux.x}px`,
          top: `${tux.y}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: 20
        }}
      >
        <TuxCartoonSprite
          tool={tux.currentTool}
          action={tux.action}
          facingRight={tux.facingRight}
          runCycle={tux.runCycle}
          actionProgress={tux.actionProgress}
          targetAngle={targetAngle}
          scale={dimensions.width < 500 ? 0.8 : 1.0}
        />
      </div>

      {/* 5. BUTTERFLIES (WINDOWS 4 SQUARES) */}
      {butterflies.map((b) => (
        <div
          key={b.id}
          className="absolute transition-transform duration-75 pointer-events-none"
          style={{
            left: `${b.x}px`,
            top: `${b.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 25
          }}
        >
          <WindowsButterflySprite
            flapPhase={b.flapPhase}
            angle={b.angle}
            scale={b.isDodging ? 1.25 : 1.0}
            isDodging={b.isDodging}
          />
        </div>
      ))}

      {/* Interactive Tap / Click Hint Cue */}
      <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-mono text-white/70 border border-white/10 pointer-events-none flex items-center gap-1.5 shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
        <span>Click anywhere to guide the Windows Butterfly • Tux will chase!</span>
      </div>
    </div>
  );
};
