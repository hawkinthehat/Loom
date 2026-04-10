import { useCallback, useMemo, useState } from 'react';

export const useRhythmSync = (bpm: number) => {
  const [isSynced, setIsSynced] = useState(false);
  const beatInterval = useMemo(() => {
    if (bpm <= 0) return Number.POSITIVE_INFINITY;
    return 60000 / bpm; // ms per beat
  }, [bpm]);

  const checkSync = useCallback(
    (tapTime: number) => {
      if (!Number.isFinite(beatInterval)) {
        setIsSynced(false);
        return false;
      }

      const remainder = tapTime % beatInterval;
      // Window of 100ms for a "Critical Hit"
      const isHit = remainder < 100 || remainder > beatInterval - 100;

      setIsSynced(isHit);
      return isHit;
    },
    [beatInterval],
  );

  return { isSynced, checkSync };
};
