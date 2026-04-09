'use client';
import { useEffect, useRef, useState } from 'react';
import { GhostSync } from '@/components/GhostSync';
import { RhythmicPulse } from '@/components/RhythmicPulse';
import { useRhythmSync } from '@/hooks/useRhythmSync';

export default function LoomPrototype() {
  const [bpm, setBpm] = useState(80);
  const [isActive, setIsActive] = useState(false);
  const [stressLevel, setStressLevel] = useState(35);
  const [activeUsers, setActiveUsers] = useState(12);
  const audioCtx = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const rafId = useRef<number | null>(null);
  const isRunning = useRef(false);
  const bpmRef = useRef(bpm);
  const { isSynced, checkSync } = useRhythmSync(bpm);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

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
    gain.gain.setValueAtTime(0.3, time);
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

  const stopAudio = () => {
    isRunning.current = false;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (audioCtx.current && audioCtx.current.state === 'running') {
      void audioCtx.current.suspend();
    }
    setIsActive(false);
  };

  const initAudio = async () => {
    checkSync(Date.now());

    if (isRunning.current) {
      stopAudio();
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
    setIsActive(true);
    scheduleLoop();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#06090f] p-6 font-sans text-[#eef6ff]">
      <GhostSync activeUsers={activeUsers} />
      <RhythmicPulse bpm={bpm} stressLevel={stressLevel} />
      <div className="space-y-8 text-center">
        <h1 className="text-5xl font-light tracking-[0.2em] opacity-80">LOOM</h1>

        <button
          onClick={initAudio}
          className={`relative z-10 flex h-64 w-64 items-center justify-center rounded-full border transition-all duration-700
            ${
              isSynced
                ? 'border-emerald-300 shadow-[0_0_60px_rgba(52,211,153,0.25)]'
                : 'border-[#244262]'
            }
            ${isActive ? 'scale-110 shadow-[0_0_50px_rgba(124,232,255,0.1)]' : 'hover:border-[#7ce8ff]'}
          `}
        >
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full border border-[#7ce8ff]/20 ${isActive ? 'animate-ping' : ''}`}
          >
            <span className="text-xs uppercase tracking-widest opacity-40">
              {isActive ? 'Pause Lattice' : 'Initialize'}
            </span>
          </div>
        </button>
        <p
          className={`text-xs uppercase tracking-[0.25em] ${
            isSynced ? 'text-emerald-300' : 'text-[#95a7bc]'
          }`}
        >
          {isSynced ? 'Critical Hit' : 'Off Beat'}
        </p>

        <div className="flex flex-col items-center gap-4 pt-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#95a7bc]">
            Tension Control: {bpm} BPM
          </p>
          <input
            type="range"
            min="40"
            max="140"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-48 accent-[#7ce8ff] opacity-50 transition-opacity hover:opacity-100"
          />
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#95a7bc]">
            Stress Level: {stressLevel}
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={stressLevel}
            onChange={(e) => setStressLevel(Number(e.target.value))}
            className="w-48 accent-rose-400 opacity-50 transition-opacity hover:opacity-100"
          />
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#95a7bc]">
            Ghost Users: {activeUsers}
          </p>
          <input
            type="range"
            min="0"
            max="30"
            value={activeUsers}
            onChange={(e) => setActiveUsers(Number(e.target.value))}
            className="w-48 accent-blue-300 opacity-50 transition-opacity hover:opacity-100"
          />
        </div>
      </div>
    </main>
  );
}
