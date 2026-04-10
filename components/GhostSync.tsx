'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

type GhostDot = {
  left: number;
  top: number;
  duration: number;
};

type GhostSyncProps = {
  activeUsers: number;
};

export const GhostSync = ({ activeUsers }: GhostSyncProps) => {
  const hashToUnit = (input: number) => {
    let x = input >>> 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };

  const ghostDots = useMemo<GhostDot[]>(
    () =>
      Array.from({ length: activeUsers }, (_, idx) => ({
        left: hashToUnit(activeUsers * 4099 + idx * 3 + 1) * 100,
        top: hashToUnit(activeUsers * 4099 + idx * 3 + 2) * 100,
        duration: 3 + hashToUnit(activeUsers * 4099 + idx * 3 + 3) * 2,
      })),
    [activeUsers],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
      {ghostDots.map((dot, i) => (
        <motion.div
          key={i}
          animate={{
            opacity: [0.1, 0.4, 0.1],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
          }}
          className="absolute h-2 w-2 rounded-full bg-blue-300"
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
          }}
        />
      ))}
    </div>
  );
};
