'use client';
import { useRef, useState } from 'react';

export default function LoomPrototype() {
  const [bpm, setBpm] = useState(80);
  const [isActive, setIsActive] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);

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
    if (!ctx) return;

    while (nextNoteTime.current < ctx.currentTime + 0.1) {
      playThud(nextNoteTime.current);
      nextNoteTime.current += 60.0 / bpm;
    }

    requestAnimationFrame(scheduleLoop);
  };

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)();
      nextNoteTime.current = audioCtx.current.currentTime;
      setIsActive(true);
      scheduleLoop();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#06090f] p-6 font-sans text-[#eef6ff]">
      <div className="space-y-8 text-center">
        <h1 className="text-5xl font-light tracking-[0.2em] opacity-80">LOOM</h1>

        <button
          onClick={initAudio}
          className={`flex h-64 w-64 items-center justify-center rounded-full border border-[#244262] transition-all duration-700
            ${isActive ? 'scale-110 shadow-[0_0_50px_rgba(124,232,255,0.1)]' : 'hover:border-[#7ce8ff]'}
          `}
        >
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full border border-[#7ce8ff]/20 ${isActive ? 'animate-ping' : ''}`}
          >
            <span className="text-xs uppercase tracking-widest opacity-40">
              {isActive ? 'Lattice Active' : 'Initialize'}
            </span>
          </div>
        </button>

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
        </div>
      </div>
    </main>
  );
}
