"use client";

import { useEffect, useRef } from "react";

interface SignalNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  pulsePhase: number;
}

export function HeroAmbientSignals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let nodes: SignalNode[] = [];
    let isIntersecting = true;
    let isDocumentVisible = true;

    let mouseX: number | null = null;
    let mouseY: number | null = null;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setupDimensions = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const initNodes = () => {
      // Quiet density for light background: ~30 nodes
      const count = Math.max(18, Math.min(32, Math.floor(width / 45)));
      nodes = [];

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          radius: Math.random() * 1.2 + 1.1,
          alpha: Math.random() * 0.22 + 0.32,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    setupDimensions();
    initNodes();

    const handleResize = () => {
      setupDimensions();
      initNodes();
    };

    const parent = canvas.parentElement;
    const handleMouseMove = (e: MouseEvent) => {
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = null;
      mouseY = null;
    };

    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove, { passive: true });
      parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    }
    window.addEventListener("resize", handleResize);

    // Stop animation when hero scrolls out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting && isDocumentVisible && !prefersReducedMotion) {
          lastTime = performance.now();
          animationFrameId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      if (isIntersecting && isDocumentVisible && !prefersReducedMotion) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const maxDistance = 120;
    const mouseRadius = 140;
    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isIntersecting || !isDocumentVisible) return;

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Ambient light-mode gradient glow centered behind the hero title
      const radGrad = ctx.createRadialGradient(
        width * 0.35,
        height * 0.4,
        40,
        width * 0.35,
        height * 0.5,
        width * 0.65
      );
      radGrad.addColorStop(0, "rgba(124, 58, 237, 0.08)");
      radGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.035)");
      radGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);

      // Update node positions
      for (const node of nodes) {
        if (!prefersReducedMotion) {
          node.x += node.vx * delta * 60;
          node.y += node.vy * delta * 60;

          if (node.x < -10) node.x = width + 10;
          if (node.x > width + 10) node.x = -10;
          if (node.y < -10) node.y = height + 10;
          if (node.y > height + 10) node.y = -10;

          // Magnetic mouse attraction
          if (mouseX !== null && mouseY !== null) {
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            const dist = Math.hypot(dx, dy);

            if (dist < mouseRadius && dist > 0) {
              const force = (1 - dist / mouseRadius) * 0.35;
              node.x += (dx / dist) * force;
              node.y += (dy / dist) * force;
            }
          }

          node.pulsePhase += 0.015;
        }
      }

      // Draw faint connections between nodes
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.22;
            ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // Draw connections to cursor
        if (mouseX !== null && mouseY !== null) {
          const mDist = Math.hypot(a.x - mouseX, a.y - mouseY);
          if (mDist < mouseRadius) {
            const mAlpha = (1 - mDist / mouseRadius) * 0.38;
            ctx.strokeStyle = `rgba(124, 58, 237, ${mAlpha})`;
            ctx.lineWidth = 0.95;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const pulse = Math.sin(node.pulsePhase) * 0.25 + 0.75;
        const currentAlpha = node.alpha * pulse;

        // Subtle soft purple halo
        ctx.fillStyle = `rgba(124, 58, 237, ${currentAlpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = `rgba(109, 40, 217, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render(0);
    } else {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (parent) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-100 transition-opacity duration-700"
    />
  );
}
