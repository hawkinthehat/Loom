import { useCallback, useEffect, useRef, useState } from 'react';

export const useLoomAudio = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const [bpm, setBpm] = useState(60);
  const nextNoteTime = useRef(0);
  const scheduleAheadTime = 0.1; // Seconds
  const lookahead = 25.0; // Milliseconds

  const nextNote = useCallback(() => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTime.current += secondsPerBeat;
  }, [bpm]);

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

  useEffect(() => {
    const timerID = setInterval(() => {
      if (!audioCtx.current) return;
      while (
        nextNoteTime.current <
        audioCtx.current.currentTime + scheduleAheadTime
      ) {
        scheduleNote(nextNoteTime.current);
        nextNote();
      }
    }, lookahead);
    return () => clearInterval(timerID);
  }, [nextNote, scheduleNote]);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
      nextNoteTime.current = audioCtx.current.currentTime;
    }
  };

  return { initAudio, setBpm, bpm };
};
