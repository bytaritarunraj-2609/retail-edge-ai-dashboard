import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';

interface GlassProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Glass({ children, className = '', style = {}, onClick }: GlassProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Motion values to track mouse position inside the glass element
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring physics for smooth trailing effect
  const smoothX = useSpring(mouseX, { stiffness: 400, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 400, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top } = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      className={'glass ' + className}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        ...style,
        // Expose mouse coordinates to CSS variables for dynamic glow effects
        '--mouse-x': useMotionTemplate`${smoothX}px`,
        '--mouse-y': useMotionTemplate`${smoothY}px`,
      } as React.CSSProperties}
    >
      {children}
    </motion.div>
  );
}
