'use client';

import { motion } from 'framer-motion';

const FEATHERS = Array.from({ length: 20 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 20;
  const distance = 180 + (i % 5) * 38;
  return {
    id: i,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotate: (i % 2 === 0 ? 1 : -1) * (240 + i * 10),
  };
});

export const ShatterEffect = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {FEATHERS.map((feather) => (
        <motion.div
          key={feather.id}
          initial={{ scale: 0, x: 0, y: 0, opacity: 0.95 }}
          animate={{
            scale: [0.2, 1, 0.7],
            x: feather.x,
            y: feather.y,
            rotate: feather.rotate,
            opacity: 0,
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 h-4 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85"
          style={{ clipPath: 'ellipse(50% 15% at 50% 50%)' }}
        />
      ))}
    </div>
  );
};
