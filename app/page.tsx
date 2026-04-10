'use client';
import { useEffect, useRef, useState } from 'react';
import { GhostSync } from '../components/GhostSync';
import { RhythmicPulse } from '../components/RhythmicPulse';
import { ShatterEffect } from '../components/ShatterEffect';
import { useRhythmSync } from '../hooks/useRhythmSync';

export default function LoomPrototype() {
  const [bpm] = useState(80);
  const [stressLevel] = useState(35); // This will hook to your wearable
  const [isBursting, setIsBursting] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const { isSynced, checkSync } = useRhythmSync(bpm);

  const audioCtx = useRef<AudioContext | null>(null);
  const droneOsc = useRef<OscillatorNode | null>(null);
  const filterNode = useRef<BiquadFilterNode | null>(null);
  const burstTimeoutRef = useRef<number | null>(null);

  // 1. RESOLUTION: Initialize the Continuous Resonance (The "Looming" Drone)
  const initAudio = async () => {
    if (audioCtx.current) return;
    
    audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    droneOsc.current = audioCtx.current.createOscillator();
    filterNode.current = audioCtx.current.createBiquadFilter();

    droneOsc.current.type = 'sawtooth';
    filterNode.current.type = 'lowpass';
    
    // Initial "Heavy" muffled sound
    filterNode.current.frequency.value = 200;

    droneOsc.current.connect(filterNode.current);
    filterNode.current.connect(audioCtx.current.destination);
    droneOsc.current.start();
  };

  // 2. LOGIC: Update the Resonance based on Sync State
  useEffect(() => {
    if (filterNode.current && audioCtx.current) {
      const targetFreq = isSynced ? 1500 : 200; // Opens up when you hit the beat
      filterNode.current.frequency.exponentialRampToValueAtTime(
        targetFreq, 
        audioCtx.current.currentTime + 0.5
      );
    }
  }, [isSynced]);

  useEffect(() => {
    return () => {
      if (burstTimeoutRef.current !== null) {
        window.clearTimeout(burstTimeoutRef.current);
      }
    };
  }, []);

  const triggerBurst = () => {
    setBurstKey((prev) => prev + 1);
    setIsBursting(true);
    if (burstTimeoutRef.current !== null) {
      window.clearTimeout(burstTimeoutRef.current);
    }
    burstTimeoutRef.current = window.setTimeout(() => {
      setIsBursting(false);
    }, 8500);
  };

  const handleLoomTap = async () => {
    await initAudio();
    const hit = checkSync(Date.now());
    if (hit) {
      triggerBurst();
    }
  };

  return (
    <main className="h-screen bg-slate-950 overflow-hidden relative" onClick={handleLoomTap}>
      <GhostSync activeUsers={12} />
      {isBursting ? <ShatterEffect key={burstKey} /> : null}
      
      {/* The Rhythmic Pulse (The Beat to follow) */}
      <RhythmicPulse bpm={bpm} stressLevel={stressLevel} />

      {/* The Interaction Layer */}
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-white/20 text-9xl font-black uppercase select-none">
          {isSynced ? "SYNCED" : "LOOMING"}
        </h1>
      </div>

      {/* HUD for wearable data */}
      <div className="absolute bottom-10 left-10 text-teal-400 font-mono text-xs">
        STRESS_INDEX: {stressLevel}% | TARGET_BPM: {bpm}
      </div>
    </main>
  );
}
