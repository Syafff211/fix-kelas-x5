'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function MouseGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className="fixed pointer-events-none z-50 w-96 h-96 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        left: position.x - 192,
        top: position.y - 192,
      }}
      animate={{
        left: position.x - 192,
        top: position.y - 192,
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
    />
  );
}
