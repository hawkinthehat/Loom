'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BluetoothButton } from '../components/BluetoothButton';
import { GhostSync } from '../components/GhostSync';
import { RhythmicPulse } from '../components/RhythmicPulse';
import { ShatterEffect } from '../components/ShatterEffect';
import { TensionString } from '../components/TensionString';
import { useRhythmSync } from '../hooks/useRhythmSync';
import { useResonance } from '../hooks/useResonance';

type ThemeMode = 'twilight' | 'clear-sky';

export default function LoomPrototype() {
  const [theme, setTheme] = useState<ThemeMode>('twilight');
  const [heartRate, setHeartRate] = useState(82);
  const [isPulseActive, setIsPulseActive] = useState(false);
  const [snapped, setSnapped] = useState(false);
  const [activeUsers, setActiveUsers] = useState(12);
  const audioCtx = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const rafId = useRef<number | null>(null);
  const isRunning = useRef(false);
  const bpmRef = useRef(heartRate);
  const { isSynced, checkSync } = useRhythmSync(heartRate);

  const stressLevel = useMemo(() => {
    const min = 50;
    const max = 180;
    const clamped = Math.min(Math.max(heartRate, min), max);
    return Math.round(((clamped - min) / (max - min)) * 100);
  }, [heartRate]);

  useEffect(() => {
    bpmRef.current = heartRate;
  }, [heartRate]);

  useEffect(() => {
    return () => {
      isRunning.current = false;
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (audioCtx.current && audioCtx.current.state !== 'closed') {
        void audioCtx.current.close();
      }
      audioCtx.current = null;
    };
  }, []);

  const playThud = (time: number) => {
    const ctx = audioCtx.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.4);
    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.4);
  };

  const scheduleLoop = () => {
    const ctx = audioCtx.current;
    if (!ctx || !isRunning.current) return;

    while (nextNoteTime.current < ctx.currentTime + 0.1) {
      playThud(nextNoteTime.current);
      nextNoteTime.current += 60.0 / bpmRef.current;
    }

    rafId.current = requestAnimationFrame(scheduleLoop);
  };

  const stopPulse = () => {
    isRunning.current = false;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (audioCtx.current && audioCtx.current.state === 'running') {
      void audioCtx.current.suspend();
    }
    setIsPulseActive(false);
  };

  const togglePulse = async () => {
    checkSync(Date.now());

    if (isRunning.current) {
      stopPulse();
      return;
    }

    if (!audioCtx.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx.current = new AudioContextClass();
    }

    if (audioCtx.current.state === 'suspended') {
      await audioCtx.current.resume();
    }

    nextNoteTime.current = audioCtx.current.currentTime;
    isRunning.current = true;
    setIsPulseActive(true);
    scheduleLoop();
  };

  // Continuous gravity drone: clears up as sync improves.
  useResonance(isSynced, stressLevel);

  return (
    <main
      className={`theme-${theme} loom-bg relative flex min-h-screen flex-col items-center overflow-hidden px-6 py-8 text-[var(--fg)]`}
    >
      <GhostSync activeUsers={activeUsers} />
      <RhythmicPulse bpm={heartRate} stressLevel={stressLevel} />
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
            Tap Heartbeat to test rhythm sync. The gravity drone runs continuously
            and brightens when you hit in time.
          </p>

          <div className="space-y-2">
            <label
              htmlFor="hr"
              className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
            >
              Heart Rate: {heartRate} BPM
            </label>
            <input
              id="hr"
              type="range"
              min={40}
              max={180}
              value={heartRate}
              onChange={(event) => setHeartRate(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void togglePulse();
              }}
              className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                isSynced
                  ? 'border-emerald-300 bg-emerald-300 text-slate-900'
                  : 'border-[var(--ring)] text-[var(--fg)] hover:border-[var(--accent)]'
              }`}
            >
              {isPulseActive ? 'Pause Heartbeat' : 'Tap Heartbeat'}
            </button>

            <BluetoothButton
              onConnected={() => {
                checkSync(Date.now());
              }}
              onHeartRate={({ bpm }) => setHeartRate(bpm)}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="ghost-users"
              className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
            >
              Ghost Users: {activeUsers}
            </label>
            <input
              id="ghost-users"
              type="range"
              min={0}
              max={30}
              value={activeUsers}
              onChange={(event) => setActiveUsers(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--ring)] bg-black/20 p-4 text-sm">
          <p className="text-[var(--muted)]">Stress</p>
          <p className="mt-1 text-3xl font-semibold">{stressLevel}</p>
          <p className="mt-4 text-[var(--muted)]">State</p>
          <p className="mt-1 font-semibold">
            {isSynced ? 'Bright / Synced' : 'Heavy / Unsynced'}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Pulse: {isPulseActive ? 'Running' : 'Stopped'}
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
