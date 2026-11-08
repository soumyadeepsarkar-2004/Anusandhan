import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
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

    // Key Lab Anchors
    const labNames = ['TUM', 'ETH Zurich', 'CERN', 'Max Planck', 'CMU', 'Oxford', 'IISc', 'Stanford', 'MIT', 'Cambridge'];
    const count = 38;
    const points: Point[] = [];

    for (let i = 0; i < count; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        baseRadius: Math.random() > 0.8 ? 2.5 : 1.5,
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

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const dark = isDarkRef.current;

      // Draw connections
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];

        // Move points slowly
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Subtle mouse interaction
        const dxMouse = mouseX - p1.x;
        const dyMouse = mouseY - p1.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 140) {
          p1.x -= dxMouse * 0.015;
          p1.y -= dyMouse * 0.015;
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = p1.label 
          ? (dark ? 'rgba(245, 158, 11, 0.7)' : 'rgba(217, 119, 6, 0.85)') 
          : (dark ? 'rgba(161, 161, 170, 0.35)' : 'rgba(100, 116, 139, 0.35)');
        ctx.fill();

        // If label exists, draw faint institutional tag
        if (p1.label && distMouse < 180) {
          ctx.font = '9px monospace';
          ctx.fillStyle = dark ? 'rgba(217, 119, 6, 0.75)' : 'rgba(180, 83, 9, 0.85)';
          ctx.fillText(p1.label, p1.x + 6, p1.y - 4);
        }

        // Inter-node links
        for (let j = i + 1; j < points.length; j++) {
          const p2 = points[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * (dark ? 0.12 : 0.08);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = dark ? `rgba(161, 161, 170, ${alpha})` : `rgba(100, 116, 139, ${alpha})`;
            ctx.lineWidth = 0.75;
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
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-500 ${isDark ? 'opacity-60' : 'opacity-85'}`}
      style={{ background: 'transparent' }}
    />
  );
};
