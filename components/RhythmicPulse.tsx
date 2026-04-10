'use client';

import { motion } from 'framer-motion';

type RhythmicPulseProps = {
  bpm: number;
  stressLevel: number;
};

export const RhythmicPulse = ({ bpm, stressLevel }: RhythmicPulseProps) => {
  const duration = 60 / bpm;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
          // Higher stress means less symmetric pulse.
          borderRadius:
            stressLevel > 70
              ? '30% 70% 70% 30% / 30% 30% 70% 70%'
              : '50%',
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`h-32 w-32 border-2 ${
          stressLevel > 70 ? 'border-red-500' : 'border-white'
        }`}
      />
    </div>
  );
};
