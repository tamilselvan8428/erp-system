import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const FormSuccessEffect = ({ message, title, onClose }) => {
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // 1. 3D Interactive Parallax Card Tilt
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate relative cursor position from -0.5 to 0.5
    const relativeX = (e.clientX - rect.left) / width - 0.5;
    const relativeY = (e.clientY - rect.top) / height - 0.5;
    
    // Max tilt angle (degrees)
    const maxTilt = 18;
    setTilt({
      x: -relativeY * maxTilt, // Tilting vertically
      y: relativeX * maxTilt,  // Tilting horizontally
    });
  };

  const handleMouseLeave = () => {
    // Smoothly spring back to center
    setTilt({ x: 0, y: 0 });
  };

  // 2. High-Performance Canvas-based 3D Confetti Particle Physics Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let particles = [];
    const maxParticles = 160;
    const fov = 350; // Perspective Projection Field of View

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class ConfettiParticle {
      constructor(isInteractive = false, mouseX = 0, mouseY = 0) {
        this.reset(isInteractive, mouseX, mouseY);
      }

      reset(isInteractive = false, mouseX = 0, mouseY = 0) {
        // If interactive (click), spawn at click position; else spawn at central source
        this.x = isInteractive ? mouseX : canvas.width / 2;
        this.y = isInteractive ? mouseY : canvas.height / 2 - 40;
        this.z = isInteractive ? (Math.random() - 0.5) * 50 : 0;

        // 3D velocity vectors
        const angle = Math.random() * Math.PI * 2;
        const speed = isInteractive ? Math.random() * 12 + 6 : Math.random() * 9 + 5;
        this.vx = Math.cos(angle) * speed;
        // Central burst pushes upward, interactive spreads radial
        this.vy = isInteractive ? Math.sin(angle) * speed : Math.sin(angle) * speed - (Math.random() * 6 + 6);
        this.vz = (Math.random() - 0.5) * 10;

        this.gravity = 0.18;
        this.friction = 0.97;

        // 3D spin parameters
        this.rx = Math.random() * 360;
        this.ry = Math.random() * 360;
        this.rz = Math.random() * 360;

        this.vrx = (Math.random() - 0.5) * 12;
        this.vry = (Math.random() - 0.5) * 12;
        this.vrz = (Math.random() - 0.5) * 12;

        // Theme colors (Primary Blue, Golden Yellow, Success Green, Danger Pink/Red, Purple)
        const themeColors = ['#1F57A3', '#153E75', '#ECBF19', '#28A745', '#FF9800', '#DC3545', '#9333EA', '#06B6D4'];
        this.color = themeColors[Math.floor(Math.random() * themeColors.length)];
        
        this.size = Math.random() * 10 + 6;
        this.shape = Math.random() > 0.45 ? 'rect' : 'circle';
        this.isRibbon = Math.random() > 0.75;
        this.ribbonLength = Math.random() * 18 + 12;
        this.opacity = 1;
        this.life = 0;
        this.maxLife = Math.random() * 100 + 100;
      }

      update() {
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vz *= this.friction;

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        this.rx += this.vrx;
        this.ry += this.vry;
        this.rz += this.vrz;

        this.life++;

        // Fade out near bottom of screen or at end of life
        if (this.y > canvas.height - 120 || this.life > this.maxLife) {
          this.opacity -= 0.025;
        }
      }

      draw(ctx) {
        if (this.opacity <= 0) return;

        // 3D Perspective Projection formula: scale = fov / (fov + z)
        const scale = fov / (fov + this.z);
        
        // Project coordinates centered on screen
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const projX = (this.x - centerX) * scale + centerX;
        const projY = (this.y - centerY) * scale + centerY;

        const projSize = this.size * scale;
        if (projSize <= 0) return;

        ctx.save();
        ctx.translate(projX, projY);
        
        // 3D rotation matrix multiplication simulation in Canvas 2D
        ctx.rotate(this.rz * Math.PI / 180);
        const cosY = Math.cos(this.ry * Math.PI / 180);
        const cosX = Math.cos(this.rx * Math.PI / 180);
        ctx.scale(cosY, cosX);

        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.opacity;

        if (this.isRibbon) {
          ctx.beginPath();
          ctx.moveTo(-projSize / 2, -this.ribbonLength / 2);
          // wavy bezier curve simulation
          ctx.quadraticCurveTo(projSize * 0.8, 0, -projSize / 2, this.ribbonLength / 2);
          ctx.lineWidth = projSize / 2.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        } else if (this.shape === 'rect') {
          ctx.fillRect(-projSize / 2, -projSize / 2, projSize, projSize);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, projSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // Populate initial particles burst
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new ConfettiParticle());
    }

    // Canvas rendering loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Filter out faded particles
      particles = particles.filter(p => p.opacity > 0);

      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      // Maintain active particles count if needed, or let them exhaust
      animationId = requestAnimationFrame(render);
    };
    render();

    // Spawn extra burst on user click
    const handleCanvasClick = (e) => {
      const clickX = e.clientX;
      const clickY = e.clientY;
      for (let i = 0; i < 25; i++) {
        particles.push(new ConfettiParticle(true, clickX, clickY));
      }
    };
    window.addEventListener('click', handleCanvasClick);

    // Auto-dismiss safety timer (closes after 4.2 seconds)
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, 4200);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('click', handleCanvasClick);
      clearTimeout(autoCloseTimer);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden select-none">
      {/* Dark Blur Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm cursor-pointer"
      />

      {/* Confetti Particle Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-[10000]"
      />

      {/* 3D Visual Card Container */}
      <div 
        style={{ perspective: 1200 }} 
        className="relative z-[10001] w-full max-w-md pointer-events-auto"
      >
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, rotateX: -65, rotateY: 10, scale: 0.8, translateZ: -250 }}
          animate={{ opacity: 1, rotateX: tilt.x, rotateY: tilt.y, scale: 1, translateZ: 0 }}
          transition={{
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 },
            rotateX: { type: 'spring', damping: 18, stiffness: 180 },
            rotateY: { type: 'spring', damping: 18, stiffness: 180 },
          }}
          style={{
            transformStyle: 'preserve-3d',
          }}
          className="w-full bg-white/85 backdrop-blur-md border border-white/45 shadow-2xl rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Holographic light glow overlay */}
          <div className="absolute -inset-20 bg-gradient-to-tr from-primary/10 via-transparent to-accent/15 rounded-full blur-3xl pointer-events-none" />

          {/* 3D Layered Checkmark Badge */}
          <div 
            style={{ transform: 'translateZ(40px)', transformStyle: 'preserve-3d' }}
            className="relative w-20 h-20 mb-6 flex items-center justify-center"
          >
            {/* Pulsing ring 1 (Lowest layer) */}
            <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" />

            {/* Glowing ring 2 (Deep layer) */}
            <div 
              style={{ transform: 'translateZ(-10px)' }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-success/20 to-green-500/40 blur-md"
            />

            {/* Solid Ring 3 (Base layer) */}
            <div className="absolute inset-0 rounded-full border-2 border-success/35 bg-green-50" />

            {/* Raised Icon Layer (Floating on top) */}
            <div 
              style={{ transform: 'translateZ(20px)' }}
              className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-success to-green-600 flex items-center justify-center shadow-lg text-white"
            >
              <Check size={28} strokeWidth={3} className="animate-draw-progress" />
            </div>
          </div>

          {/* 3D Elevated Text Header */}
          <div 
            style={{ transform: 'translateZ(25px)' }}
            className="space-y-2.5 mb-8"
          >
            <h2 className="text-xl font-black tracking-wide text-slate-800 uppercase">
              {title}
            </h2>
            <div className="h-1 w-12 bg-gradient-to-r from-success to-primary rounded-full mx-auto" />
            <p className="text-xs font-semibold text-slate-500 max-w-sm leading-relaxed mt-1">
              {message}
            </p>
          </div>

          {/* 3D Action Button */}
          <button
            onClick={onClose}
            style={{ transform: 'translateZ(30px)' }}
            className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white text-xs font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary-dark/30 transform transition-all active:translate-y-0.5 active:shadow-md cursor-pointer select-none"
          >
            Continue
          </button>
        </motion.div>
      </div>
    </div>
  );
};
