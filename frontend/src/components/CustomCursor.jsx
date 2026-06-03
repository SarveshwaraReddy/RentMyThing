import React, { useEffect, useRef, useState } from "react";

/**
 * CustomCursor
 * A high-performance, double-element animated cursor featuring:
 * 1. Zero-latency inner core tracking with neon styling
 * 2. Lagging/lerping outer ring with velocity-based elastic distortion (stretching)
 * 3. Dynamic hover scaling & color transitions on interactive elements
 * 4. High-performance canvas-based flare particle trail (releasing glowing trail micro-flares)
 * 5. Automatic bypass on touch-capable devices
 */
export default function CustomCursor() {
  const coreRef = useRef(null);
  const ringRef = useRef(null);
  const canvasRef = useRef(null);

  // Core coordinates (mouse target position)
  const mouseRef = useRef({ x: 0, y: 0 });
  
  // Current interpolated positions
  const corePos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });

  // Hover and visibility states
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Target hover scale ref for lerping scale in animation loop
  const hoverScaleRef = useRef(1.0);
  
  // Particle trail ref
  const particlesRef = useRef([]);

  useEffect(() => {
    // 1. Detect touch capabilities (avoid custom cursor on mobile/touch screens)
    const checkTouchDevice = () => {
      const hasTouch =
        window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
      return hasTouch;
    };

    const touchDetected = checkTouchDevice();
    if (touchDetected) return;

    // 2. Hide default OS cursor by adding class to html root
    document.documentElement.classList.add("custom-cursor-active");

    // 3. Resize canvas to match the browser window
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // 4. Helper to spawn flare particles
    const spawnParticles = (x, y, count = 2) => {
      const particles = particlesRef.current;
      // Change trail colors based on hover state
      // Normal: Neon Orange (#ff5e00) and Neon Pink (#ff007f)
      // Hovered: Neon Cyan (#00f0ff) and Cool Blue (#3b82f6)
      const isCurrentlyHovered = hoverScaleRef.current > 1.0;
      const color1 = isCurrentlyHovered ? "#00f0ff" : "#ff5e00";
      const color2 = isCurrentlyHovered ? "#3b82f6" : "#ff007f";

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5; // Spread speed
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1.0,
          size: Math.random() * 3.5 + 2.0, // size radius
          color: Math.random() > 0.5 ? color1 : color2,
          decay: Math.random() * 0.015 + 0.015, // decay rate per frame
        });
      }
    };

    // 5. Track mouse coordinates on movement
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      if (!isVisible) {
        setIsVisible(true);
        // Sync position immediately on first move
        corePos.current.x = e.clientX;
        corePos.current.y = e.clientY;
        ringPos.current.x = e.clientX;
        ringPos.current.y = e.clientY;
      }

      // Spawn trail flares at cursor location
      spawnParticles(e.clientX, e.clientY, 2);
    };

    // 6. Viewport boundaries handling
    const handleMouseLeaveViewport = () => setIsVisible(false);
    const handleMouseEnterViewport = () => setIsVisible(true);

    // 7. Global Hover Detection using event delegation
    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      // Match typical interactive elements
      const isInteractive = target.closest(
        'a, button, input:not([type="hidden"]), select, textarea, [role="button"], [data-hover]'
      );

      if (isInteractive) {
        setIsHovered(true);
        hoverScaleRef.current = 1.8;
      } else {
        setIsHovered(false);
        hoverScaleRef.current = 1.0;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeaveViewport);
    document.addEventListener("mouseenter", handleMouseEnterViewport);
    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeaveViewport);
      document.removeEventListener("mouseenter", handleMouseEnterViewport);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isVisible, isTouchDevice]);

  // 8. Animation loop using requestAnimationFrame
  useEffect(() => {
    if (isTouchDevice) return;

    let animFrameId;
    let currentHoverScale = 1.0;

    const render = () => {
      const core = coreRef.current;
      const ring = ringRef.current;
      const canvas = canvasRef.current;

      if (!core || !ring) {
        animFrameId = requestAnimationFrame(render);
        return;
      }

      // Position inner core instantly (zero latency)
      corePos.current.x = mouseRef.current.x;
      corePos.current.y = mouseRef.current.y;
      core.style.transform = `translate3d(${corePos.current.x}px, ${corePos.current.y}px, 0)`;

      // Position outer ring with interpolation (lerp)
      const ease = 0.16; // Lerp speed
      const dx = mouseRef.current.x - ringPos.current.x;
      const dy = mouseRef.current.y - ringPos.current.y;

      ringPos.current.x += dx * ease;
      ringPos.current.y += dy * ease;

      // Calculate translation velocity
      const vx = dx * ease;
      const vy = dy * ease;
      const velocity = Math.sqrt(vx * vx + vy * vy);

      // Angle of movement (in degrees) for rotation alignment
      const angle = Math.atan2(vy, vx) * (180 / Math.PI);

      // Elastic distortion (elongate on motion axis, compress on perpendicular axis)
      const maxStretch = 1.5;
      const stretch = Math.min(1 + velocity * 0.035, maxStretch);
      const compress = 1 / stretch;

      // Lerp hover scale transition
      currentHoverScale += (hoverScaleRef.current - currentHoverScale) * 0.15;

      // Apply transformations: Translate -> Rotate -> Scale (distortion)
      ring.style.transform = `
        translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)
        rotate(${angle}deg)
        scale(${currentHoverScale * stretch}, ${currentHoverScale * compress})
      `;

      // Update and render canvas particles for trail flares
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          const particles = particlesRef.current;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            // Physics update
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            p.size -= p.decay * 1.2;

            // Remove dead particles
            if (p.alpha <= 0 || p.size <= 0) {
              particles.splice(i, 1);
              continue;
            }

            // Draw particle
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.restore();
          }
        }
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameId);
  }, [isTouchDevice]);

  if (isTouchDevice) return null;

  return (
    <div
      className={`custom-cursor-container ${isVisible ? "visible" : ""} ${
        isHovered ? "hovered" : ""
      }`}
    >
      <canvas ref={canvasRef} className="custom-cursor-canvas" />
      <div ref={coreRef} className="custom-cursor-core" />
      <div ref={ringRef} className="custom-cursor-ring" />
    </div>
  );
}
