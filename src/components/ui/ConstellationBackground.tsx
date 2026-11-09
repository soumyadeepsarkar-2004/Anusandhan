import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  hueOffset: number;
  label?: string;
}

export const ConstellationBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark } = useTheme();
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

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

    // Key Global & Indian Research Anchors
    const labNames = [
      'IISc Bangalore', 'TUM Munich', 'ETH Zurich', 'CERN Geneva',
      'IIT Bombay', 'Max Planck', 'CMU', 'Oxford',
      'IIT Delhi', 'Stanford', 'MIT CSAIL', 'Cambridge'
    ];

    const count = 48;
    const points: Point[] = [];

    for (let i = 0; i < count; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        baseRadius: Math.random() > 0.75 ? 2.8 : 1.6,
        hueOffset: Math.random() * 360,
        label: i < labNames.length ? labNames[i] : undefined
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 0.008;
      const dark = isDarkRef.current;

      // Draw subtle celestial astrolabe background rings in light mode to eliminate flatness
      if (!dark) {
        ctx.save();
        ctx.translate(width * 0.5, height * 0.42);
        const ringAngle = tick * 0.3;
        ctx.rotate(ringAngle);

        // Outer Astrolabe Ring
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(width, height) * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.04)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 12]);
        ctx.stroke();

        // Secondary Elliptical Orbital Path
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.min(width, height) * 0.38, Math.min(width, height) * 0.22, ringAngle * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.05)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.restore();
      }

      // Draw nodes and dynamic connections
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];

        // Particle kinematics
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < -20) p1.x = width + 20;
        if (p1.x > width + 20) p1.x = -20;
        if (p1.y < -20) p1.y = height + 20;
        if (p1.y > height + 20) p1.y = -20;

        // Subtle fluid mouse gravity
        const dxMouse = mouseX - p1.x;
        const dyMouse = mouseY - p1.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 160) {
          p1.x -= dxMouse * 0.012;
          p1.y -= dyMouse * 0.012;
        }

        // Draw particle node with pulsing radius
        const pulse = Math.sin(tick * 2 + p1.hueOffset) * 0.4;
        const radius = Math.max(0.8, p1.baseRadius + pulse);

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);

        if (p1.label) {
          // Labeled key institution anchors
          ctx.fillStyle = dark
            ? 'rgba(245, 158, 11, 0.85)'
            : 'rgba(217, 119, 6, 0.9)';
          ctx.shadowColor = dark ? 'rgba(245, 158, 11, 0.5)' : 'rgba(217, 119, 6, 0.35)';
          ctx.shadowBlur = 6;
        } else {
          // Ambient constellation dust
          ctx.fillStyle = dark
            ? 'rgba(161, 161, 170, 0.4)'
            : 'rgba(2, 132, 199, 0.35)';
          ctx.shadowBlur = 0;
        }
        ctx.fill();

        // Labeled tag on nearby hover or subtle presence
        if (p1.label && (distMouse < 220 || !dark)) {
          ctx.font = '500 10px "JetBrains Mono", monospace';
          ctx.fillStyle = dark
            ? (distMouse < 180 ? 'rgba(251, 191, 36, 0.95)' : 'rgba(217, 119, 6, 0.5)')
            : (distMouse < 180 ? 'rgba(180, 83, 9, 0.95)' : 'rgba(3, 105, 161, 0.55)');
          ctx.fillText(p1.label, p1.x + 8, p1.y - 4);
        }

        // Inter-node links with distance falloff
        for (let j = i + 1; j < points.length; j++) {
          const p2 = points[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 135) {
            const alpha = (1 - dist / 135) * (dark ? 0.16 : 0.13);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = dark
              ? `rgba(212, 212, 216, ${alpha})`
              : (p1.label || p2.label ? `rgba(217, 119, 6, ${alpha * 1.5})` : `rgba(2, 132, 199, ${alpha})`);
            ctx.lineWidth = p1.label || p2.label ? 1.0 : 0.75;
            ctx.setLineDash([]);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic Animated Ambient Aurora Atmosphere */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          isDark ? 'opacity-40' : 'opacity-90'
        }`}
      >
        {/* Soft Golden Amber Orb */}
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '9s' }} />

        {/* Ethereal Sky Sapphire Orb */}
        <div className="absolute top-1/4 -right-28 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-sky-400/20 via-indigo-500/10 to-transparent blur-[140px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />

        {/* Gentle Rose / Emerald Undulation Orb */}
        <div className="absolute -bottom-40 left-1/3 w-[800px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-400/15 via-amber-300/10 to-transparent blur-[140px] animate-pulse" style={{ animationDuration: '14s', animationDelay: '4s' }} />
      </div>

      {/* Interactive Mathematical Constellation Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full transition-opacity duration-500 ${isDark ? 'opacity-70' : 'opacity-95'}`}
        style={{ background: 'transparent' }}
      />
    </div>
  );
};
