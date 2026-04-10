'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';

type TensionStringProps = {
  onSnap: () => void;
  targetRhythm: number;
};

export const TensionString = ({ onSnap, targetRhythm }: TensionStringProps) => {
  const y = useMotionValue(0);

  // Visual "bowing" of the string as it is pulled
  const path = useTransform(y, (latest) => `M 0 100 Q 200 ${100 + latest} 400 100`);

  return (
    <div className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <svg className="absolute h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        <motion.path d={path} stroke="white" strokeWidth="2" fill="transparent" />
      </svg>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 300 }}
        dragElastic={0.25}
        style={{ y }}
        onDragEnd={(_e, info) => {
          // Rhythm scales the snap threshold slightly to create a tighter "timing window".
          const rhythmThreshold = Math.max(120, 220 - targetRhythm);
          if (info.point.y > rhythmThreshold) {
            onSnap();
          }
        }}
        className="z-10 flex h-32 w-24 cursor-grab items-center justify-center rounded-lg border border-stone-700 bg-black shadow-2xl active:cursor-grabbing"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Obsidian</span>
      </motion.div>
    </div>
  );
};
