'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShatterEffect } from '../components/ShatterEffect';
import { TensionString } from '../components/TensionString';
import { useHeartRate } from '../hooks/useHeartRate';
import { useResonance } from '../hooks/useResonance';

type ThemeMode = 'twilight' | 'clear-sky';

export default function LoomPrototype() {
  const [theme, setTheme] = useState<ThemeMode>('twilight');
  const [simulatedHeartRate, setSimulatedHeartRate] = useState(82);
  const [snapped, setSnapped] = useState(false);
  const {
    heartRate: liveHeartRate,
    connect,
    disconnect,
    isConnecting,
    error,
  } = useHeartRate();

  const isSynced = liveHeartRate !== null;
  const heartRate = liveHeartRate ?? simulatedHeartRate;

  const stressLevel = useMemo(() => {
    const min = 50;
    const max = 180;
    const clamped = Math.min(Math.max(heartRate, min), max);
    return Math.round(((clamped - min) / (max - min)) * 100);
  }, [heartRate]);

  useResonance(isSynced, stressLevel);

  return (
    <main
      className={`theme-${theme} loom-bg relative flex min-h-screen flex-col items-center overflow-hidden px-6 py-8 text-[var(--fg)]`}
    >
      <header className="z-10 flex w-full max-w-4xl items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-[0.28em]">LOOM</h1>
        <button
          type="button"
          onClick={() =>
            setTheme((prev) => (prev === 'twilight' ? 'clear-sky' : 'twilight'))
          }
          className="rounded-full border border-[var(--ring)] px-4 py-2 text-xs font-semibold uppercase tracking-widest transition hover:bg-[var(--accent)] hover:text-[var(--bg)]"
        >
          Theme: {theme === 'twilight' ? 'Twilight' : 'Clear Sky'}
        </button>
      </header>

      <section className="z-10 mt-8 grid w-full max-w-4xl gap-6 rounded-2xl border border-[var(--ring)] bg-black/10 p-6 backdrop-blur-sm md:grid-cols-[1fr_auto]">
        <div className="space-y-5">
          <p className="text-sm text-[var(--muted)]">
            Drag the obsidian pull downward and release to snap. Synced mode opens
            the resonance filter for a brighter tone.
          </p>

          <div className="space-y-2">
            <label
              htmlFor="hr"
              className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
            >
              Heart Rate: {heartRate} BPM {isSynced ? '(live)' : '(simulated)'}
            </label>
            <input
              id="hr"
              type="range"
              min={40}
              max={180}
              value={heartRate}
              disabled={isSynced}
              onChange={(event) => setSimulatedHeartRate(Number(event.target.value))}
              className="w-full accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isSynced) {
                  disconnect();
                  return;
                }
                void connect();
              }}
              disabled={isConnecting}
              className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                isSynced
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]'
                  : 'border-[var(--ring)] text-[var(--fg)] hover:border-[var(--accent)]'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isSynced
                ? 'Disconnect Wearable'
                : isConnecting
                  ? 'Connecting...'
                  : 'Sync Wearable'}
            </button>
            {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--ring)] bg-black/20 p-4 text-sm">
          <p className="text-[var(--muted)]">Stress</p>
          <p className="mt-1 text-3xl font-semibold">{stressLevel}</p>
          <p className="mt-4 text-[var(--muted)]">State</p>
          <p className="mt-1 font-semibold">
            {isSynced ? 'Bright / Synced (Live Pulse)' : 'Heavy / Unsynced'}
          </p>
        </div>
      </section>

      <section className="z-10 mt-8 w-full max-w-4xl">
        <TensionString
          targetRhythm={heartRate}
          onSnap={() => {
            setSnapped(true);
            window.setTimeout(() => setSnapped(false), 1600);
          }}
        />
      </section>

      <AnimatePresence>{snapped ? <ShatterEffect /> : null}</AnimatePresence>
    </main>
  );
}
