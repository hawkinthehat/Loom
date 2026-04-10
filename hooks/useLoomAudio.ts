import { useCallback, useEffect, useRef, useState } from 'react';

const scheduleAheadTime = 0.1; // Seconds
const lookahead = 25.0; // Milliseconds

export const useLoomAudio = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const timerId = useRef<number | null>(null);
  const nextNoteTime = useRef(0);
  const [bpm, setBpm] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const bpmRef = useRef(bpm);

  const clearScheduler = useCallback(() => {
    if (timerId.current !== null) {
      window.clearInterval(timerId.current);
      timerId.current = null;
    }
  }, []);

  const nextNote = useCallback(() => {
    const secondsPerBeat = 60.0 / bpmRef.current;
    nextNoteTime.current += secondsPerBeat;
  }, []);

  const scheduleNote = useCallback((time: number) => {
    if (!audioCtx.current) return;

    // Create a simple "Obsidian" thud sound
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.current.destination);

    osc.start(time);
    osc.stop(time + 0.5);
  }, []);

  const schedulerTick = useCallback(() => {
    if (!audioCtx.current) return;

    while (
      nextNoteTime.current <
      audioCtx.current.currentTime + scheduleAheadTime
    ) {
      scheduleNote(nextNoteTime.current);
      nextNote();
    }
  }, [nextNote, scheduleNote]);

  const initAudio = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new (
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
      nextNoteTime.current = audioCtx.current.currentTime;
    }
  }, []);

  const startAudio = useCallback(async () => {
    initAudio();

    if (!audioCtx.current) return;
    if (audioCtx.current.state === 'suspended') {
      await audioCtx.current.resume();
    }

    nextNoteTime.current = audioCtx.current.currentTime;
    clearScheduler();
    timerId.current = window.setInterval(schedulerTick, lookahead);
    setIsPlaying(true);
  }, [clearScheduler, initAudio, schedulerTick]);

  const stopAudio = useCallback(() => {
    clearScheduler();
    if (audioCtx.current && audioCtx.current.state === 'running') {
      void audioCtx.current.suspend();
    }
    setIsPlaying(false);
  }, [clearScheduler]);

  const toggleAudio = useCallback(async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }
    await startAudio();
  }, [isPlaying, startAudio, stopAudio]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    return () => {
      clearScheduler();
      if (audioCtx.current && audioCtx.current.state !== 'closed') {
        void audioCtx.current.close();
      }
      audioCtx.current = null;
    };
  }, [clearScheduler]);

  return { initAudio, startAudio, stopAudio, toggleAudio, setBpm, bpm, isPlaying };
};
