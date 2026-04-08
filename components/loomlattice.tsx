import { type ReactNode, useMemo } from 'react';

export type ObsidianWeight = 'NORMAL' | 'HEAVY';

export type LoomLatticeProps = {
  heartRate: number;
};

/**
 * Maps heart rate (BPM) to a normalized tension value in [0, 1].
 * - 50 BPM -> 0.0
 * - 180 BPM -> 1.0
 */
export const calculateTension = (heartRate: number): number => {
  const MIN_BPM = 50;
  const MAX_BPM = 180;
  const clamped = Math.min(Math.max(heartRate, MIN_BPM), MAX_BPM);
  const exponentialTension = Math.pow((clamped - MIN_BPM) / (MAX_BPM - MIN_BPM), 1.5);
  return exponentialTension;
};

type StageProps = {
  children: ReactNode;
};

const Stage = ({ children }: StageProps) => {
  // Placeholder scene root. Swap for your renderer root (R3F/Canvas/etc).
  return <>{children}</>;
};

type TensionStringProps = {
  tension: number;
};

const TensionString = ({ tension }: TensionStringProps) => {
  // Placeholder primitive. Wire tension into your physics engine here.
  return (
    <div data-component="tension-string" data-tension={tension.toFixed(3)}>
      Tension String
    </div>
  );
};

type ObsidianShardProps = {
  weight: ObsidianWeight;
};

const ObsidianShard = ({ weight }: ObsidianShardProps) => {
  // Placeholder primitive. Map weight to body mass/inertia in physics engine.
  return (
    <div data-component="obsidian-shard" data-weight={weight}>
      Obsidian Shard ({weight})
    </div>
  );
};

export const LoomLattice = ({ heartRate }: LoomLatticeProps) => {
  // As heart rate goes up, the "tension" constant increases.
  const stringTension = useMemo(() => calculateTension(heartRate), [heartRate]);
  const shardWeight: ObsidianWeight = heartRate > 90 ? 'HEAVY' : 'NORMAL';

  return (
    <Stage>
      <TensionString tension={stringTension} />
      <ObsidianShard weight={shardWeight} />
    </Stage>
  );
};
