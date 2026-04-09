'use client';

import { useHeartRate } from '../hooks/useHeartRate';

type TensionStringProps = {
  stressLevel: number;
  targetBPM: number;
};

const TensionString = ({ stressLevel, targetBPM }: TensionStringProps) => {
  const width = Math.min(100, 30 + stressLevel * 70);
  const displayStress = Math.round(stressLevel * 100);

  return (
    <div className="w-full max-w-lg space-y-4 text-center">
      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
        Target Rhythm: {targetBPM} BPM
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800/80">
        <div
          className="h-2 rounded-full bg-cyan-300 transition-all duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">
        String Stress: {displayStress}%
      </div>
    </div>
  );
};

type GhostSyncProps = {
  activeUsers: number;
};

const GhostSync = ({ activeUsers }: GhostSyncProps) => {
  return (
    <div className="pt-8 text-[10px] uppercase tracking-[0.3em] text-slate-500">
      Ghost Sync: {activeUsers} linked echoes
    </div>
  );
};

export const LoomGame = () => {
  const { heartRate, connect, isConnecting, error } = useHeartRate();

  // Baseline heart rate (e.g., 70). Stress is calculated by the deviation.
  const stressFactor = heartRate ? Math.max(0, (heartRate - 70) / 50) : 0;

  return (
    <div className="relative flex h-screen flex-col items-center justify-center bg-slate-950 px-6">
      {!heartRate ? (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => {
              void connect();
            }}
            disabled={isConnecting}
            className="rounded-full bg-white px-6 py-3 font-bold text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConnecting ? 'CONNECTING...' : 'SYNC WEARABLE'}
          </button>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
      ) : (
        <>
          <div className="absolute top-10 text-xs tracking-widest text-white opacity-30">
            LIVE PULSE: {heartRate} BPM
          </div>

          <TensionString
            stressLevel={stressFactor} // Increases "weight" and "dissonance"
            targetBPM={60} // The goal rhythm to achieve "Snap"
          />

          <GhostSync activeUsers={5} />
        </>
      )}
    </div>
  );
};

export default LoomGame;
