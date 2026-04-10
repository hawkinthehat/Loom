'use client';

import { motion } from 'framer-motion';

const FEATHERS = Array.from({ length: 24 }, (_, i) => {
  const spread = (i / 23 - 0.5) * 2; // -1 to 1
  const launchHeight = 240 + (i % 6) * 28;
  const hangHeight = launchHeight * (0.68 + (i % 3) * 0.08);
  const landingY = 320 + (i % 5) * 22;
  const drift = 38 + (i % 4) * 14;
  const spin = (spread >= 0 ? 1 : -1) * (220 + i * 12);

  return {
    id: i,
    x: [0, spread * 22, spread * drift, -spread * drift * 0.58, spread * drift * 0.32],
    y: [0, -launchHeight, -hangHeight, landingY],
    rotate: [0, spin * 0.35, spin * 0.72, spin],
    delay: (i % 6) * 0.06,
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
            scale: [0.2, 1, 0.85, 0.65],
            x: feather.x,
            y: feather.y,
            rotate: feather.rotate,
            opacity: [0, 0.95, 0.82, 0],
          }}
          transition={{
            delay: feather.delay,
            x: { duration: 8, times: [0, 0.24, 0.5, 0.76, 1], ease: 'easeInOut' },
            y: { duration: 8, times: [0, 0.2, 0.45, 1], ease: ['easeOut', 'linear', 'easeIn'] },
            rotate: { duration: 8, times: [0, 0.35, 0.7, 1], ease: 'linear' },
            scale: { duration: 8, times: [0, 0.12, 0.72, 1], ease: 'easeOut' },
            opacity: { duration: 8, times: [0, 0.06, 0.82, 1], ease: 'easeOut' },
          }}
          className="absolute left-1/2 top-1/2 h-4 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85"
          style={{ clipPath: 'ellipse(50% 15% at 50% 50%)' }}
        />
      ))}
    </div>
  );
};
