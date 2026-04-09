import { useEffect, useRef } from 'react';

export const useResonance = (isSynced: boolean, stressLevel: number) => {
  const audioCtx = useRef<AudioContext | null>(null);
  const oscillator = useRef<OscillatorNode | null>(null);
  const filter = useRef<BiquadFilterNode | null>(null);

  useEffect(() => {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    audioCtx.current = new AudioContextClass();
    oscillator.current = audioCtx.current.createOscillator();
    filter.current = audioCtx.current.createBiquadFilter();

    // Dissonant low hum for heavy states.
    oscillator.current.type = 'sawtooth';
    oscillator.current.frequency.setValueAtTime(80, audioCtx.current.currentTime);
    filter.current.type = 'lowpass';
    filter.current.frequency.setValueAtTime(200, audioCtx.current.currentTime);

    oscillator.current.connect(filter.current);
    filter.current.connect(audioCtx.current.destination);
    oscillator.current.start();

    return () => {
      oscillator.current?.stop();
      oscillator.current?.disconnect();
      filter.current?.disconnect();
      oscillator.current = null;
      filter.current = null;
      if (audioCtx.current && audioCtx.current.state !== 'closed') {
        void audioCtx.current.close();
      }
      audioCtx.current = null;
    };
  }, []);

  useEffect(() => {
    if (!filter.current || !audioCtx.current) return;
    const base = 200 - stressLevel * 10;
    const frequency = isSynced ? 1200 : Math.max(30, base);
    filter.current.frequency.exponentialRampToValueAtTime(
      frequency,
      audioCtx.current.currentTime + 0.5
    );
  }, [isSynced, stressLevel]);
};
