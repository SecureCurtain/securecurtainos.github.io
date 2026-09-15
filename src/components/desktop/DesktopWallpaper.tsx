// jb7572_2026-08-25: High-Performance Live Animated & Graphic Desktop Wallpaper Engine

import React, { useEffect, useRef } from 'react';
import { useDesktop } from '../../context/DesktopContext';

export const DesktopWallpaper: React.FC = () => {
  const { wallpaper } = useDesktop();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Matrix Rain State
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));
    const matrixChars = '01アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF';

    // Particle / Star State
    const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = Array.from(
      { length: 80 },
      () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.2 + 0.05
      })
    );

    let tick = 0;

    const render = () => {
      tick++;

      if (wallpaper === 'animated-grid') {
        // Horizon grid
        ctx.fillStyle = '#06060c';
        ctx.fillRect(0, 0, width, height);

        // Sky stars
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        stars.forEach(star => {
          star.y += star.speed;
          if (star.y > height) star.y = 0;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Horizon glow
        const horizonY = height * 0.65;
        const grad = ctx.createLinearGradient(0, horizonY - 120, 0, horizonY + 80);
        grad.addColorStop(0, 'rgba(168, 85, 247, 0)');
        grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.25)');
        grad.addColorStop(0.8, 'rgba(6, 182, 212, 0.2)');
        grad.addColorStop(1, 'rgba(6, 6, 12, 1)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, horizonY - 120, width, 200);

        // Horizon line
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);
        ctx.stroke();

        // Perspective grid lines
        const vpX = width / 2;
        const vpY = horizonY;
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.22)';
        ctx.lineWidth = 1;

        const numLines = 24;
        for (let i = 0; i <= numLines; i++) {
          const x = (width / numLines) * i;
          ctx.beginPath();
          ctx.moveTo(vpX, vpY);
          ctx.lineTo(x + (x - vpX) * 2, height);
          ctx.stroke();
        }

        // Horizontal moving lines
        const speed = 0.8;
        const offset = (tick * speed) % 40;
        for (let y = horizonY; y < height; y += Math.pow((y - horizonY) / 14, 1.4) + 12) {
          const animatedY = y + (offset * (y - horizonY)) / height;
          if (animatedY <= height && animatedY >= horizonY) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${Math.min(0.35, ((animatedY - horizonY) / (height - horizonY)) * 0.4)})`;
            ctx.beginPath();
            ctx.moveTo(0, animatedY);
            ctx.lineTo(width, animatedY);
            ctx.stroke();
          }
        }
      } else if (wallpaper === 'matrix-code') {
        // Matrix Rain
        ctx.fillStyle = 'rgba(2, 10, 5, 0.15)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#10b981';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // Head of drop is bright white-green
          ctx.fillStyle = '#a7f3d0';
          ctx.fillText(text, x, y);

          ctx.fillStyle = '#059669';
          ctx.fillText(text, x, y - fontSize);

          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      } else if (wallpaper === 'aurora-mesh') {
        // Organic aurora waveform
        ctx.fillStyle = '#050714';
        ctx.fillRect(0, 0, width, height);

        const time = tick * 0.005;
        const auroraColors = [
          'rgba(56, 189, 248, 0.15)',
          'rgba(168, 85, 247, 0.18)',
          'rgba(52, 211, 153, 0.12)'
        ];

        auroraColors.forEach((col, idx) => {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 30) {
            const wave1 = Math.sin(x * 0.003 + time + idx) * 120;
            const wave2 = Math.cos(x * 0.002 - time * 0.8) * 80;
            const y = height * 0.5 + wave1 + wave2 + idx * 40;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();
        });
      } else if (wallpaper === 'deep-nebula') {
        // Deep Nebula Starfield
        ctx.fillStyle = '#06040d';
        ctx.fillRect(0, 0, width, height);

        // Cosmic clouds
        const radialGrad = ctx.createRadialGradient(
          width * 0.4 + Math.sin(tick * 0.002) * 50,
          height * 0.45 + Math.cos(tick * 0.002) * 40,
          20,
          width * 0.4,
          height * 0.45,
          width * 0.5
        );
        radialGrad.addColorStop(0, 'rgba(147, 51, 234, 0.2)');
        radialGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.12)');
        radialGrad.addColorStop(1, 'rgba(6, 4, 13, 0)');
        ctx.fillStyle = radialGrad;
        ctx.fillRect(0, 0, width, height);

        // Stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        stars.forEach(star => {
          const twinkle = Math.sin(tick * 0.05 + star.x) * 0.3 + 0.7;
          ctx.globalAlpha = star.alpha * twinkle;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      } else if (wallpaper === 'cyber-topography') {
        // Dark Topography Lines
        ctx.fillStyle = '#0a0c10';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
        ctx.lineWidth = 1.2;

        const numRings = 16;
        const centerX = width * 0.5;
        const centerY = height * 0.48;

        for (let r = 1; r <= numRings; r++) {
          const radius = r * 45;
          ctx.beginPath();
          for (let angle = 0; angle <= Math.PI * 2; angle += 0.05) {
            const distortion = Math.sin(angle * 6 + tick * 0.003 + r) * 12 + Math.cos(angle * 3) * 18;
            const x = centerX + Math.cos(angle) * (radius + distortion);
            const y = centerY + Math.sin(angle) * (radius * 0.7 + distortion);
            if (angle === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      } else {
        // 'obsidian-glow'
        ctx.fillStyle = '#08080a';
        ctx.fillRect(0, 0, width, height);

        const radial = ctx.createRadialGradient(
          width * 0.5,
          height * 0.4,
          50,
          width * 0.5,
          height * 0.4,
          width * 0.6
        );
        radial.addColorStop(0, 'rgba(30, 30, 45, 0.4)');
        radial.addColorStop(0.6, 'rgba(15, 15, 20, 0.2)');
        radial.addColorStop(1, 'rgba(8, 8, 10, 0)');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [wallpaper]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle vignette layer */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/60 pointer-events-none" />
    </div>
  );
};
