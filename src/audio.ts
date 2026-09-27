import { useCallback, useEffect, useRef, useState } from "react";

export type AudioFrame = {
  waveform: number[];
  spectrum: number[];
  harmonics: number[];
  rms: number;
  dominantFrequency: number | null;
  note: string | null;
  cents: number | null;
  sampleRate: number | null;
};

const EMPTY_FRAME: AudioFrame = {
  waveform: [],
  spectrum: [],
  harmonics: [],
  rms: 0,
  dominantFrequency: null,
  note: null,
  cents: null,
  sampleRate: null,
};

const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

const pitchLabel = (frequency: number): { note: string; cents: number } => {
  const midiFloat = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  return { note: `${note}${octave}`, cents };
};

const downsampleWaveform = (values: Float32Array, points = 256): number[] => {
  const stride = Math.max(1, Math.floor(values.length / points));
  const result: number[] = [];
  for (let index = 0; index < values.length; index += stride) {
    result.push(values[index]);
    if (result.length >= points) break;
  }
  return result;
};

const downsampleSpectrum = (values: Uint8Array, bands = 64): number[] => {
  const width = Math.max(1, Math.floor(values.length / bands));
  const result: number[] = [];
  for (let band = 0; band < bands; band += 1) {
    const start = band * width;
    const end = Math.min(values.length, start + width);
    let total = 0;
    for (let index = start; index < end; index += 1) total += values[index];
    result.push(end > start ? total / (end - start) / 255 : 0);
  }
  return result;
};

const extractHarmonics = (
  values: Uint8Array,
  dominantBin: number,
  count = 16,
): number[] => {
  if (dominantBin <= 0) return Array.from({ length: count }, () => 0);
  return Array.from({ length: count }, (_, index) => {
    const bin = dominantBin * (index + 1);
    return bin < values.length ? values[bin] / 255 : 0;
  });
};

export const useMambaEar = () => {
  const [frame, setFrame] = useState<AudioFrame>(EMPTY_FRAME);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);

  const stop = useCallback(() => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (contextRef.current) void contextRef.current.close();
    contextRef.current = null;

    setIsActive(false);
    setFrame(EMPTY_FRAME);
  }, []);

  const start = useCallback(async () => {
    if (isActive) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone capture is not available in this browser.");
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const context = new AudioContext();
      await context.resume();

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);

      const timeData = new Float32Array(analyser.fftSize);
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);

      streamRef.current = stream;
      contextRef.current = context;
      setIsActive(true);

      const tick = (now: number) => {
        analyser.getFloatTimeDomainData(timeData);
        analyser.getByteFrequencyData(frequencyData);

        if (now - lastFrameRef.current >= 33) {
          lastFrameRef.current = now;

          let energy = 0;
          for (const sample of timeData) energy += sample * sample;
          const rms = Math.sqrt(energy / timeData.length);

          let dominantBin = 0;
          let dominantValue = 0;
          for (let index = 1; index < frequencyData.length; index += 1) {
            if (frequencyData[index] > dominantValue) {
              dominantValue = frequencyData[index];
              dominantBin = index;
            }
          }

          const dominantFrequency =
            dominantValue > 18
              ? (dominantBin * context.sampleRate) / analyser.fftSize
              : null;
          const pitch =
            dominantFrequency && dominantFrequency >= 20
              ? pitchLabel(dominantFrequency)
              : null;

          setFrame({
            waveform: downsampleWaveform(timeData),
            spectrum: downsampleSpectrum(frequencyData),
            harmonics: extractHarmonics(frequencyData, dominantBin),
            rms,
            dominantFrequency,
            note: pitch?.note ?? null,
            cents: pitch?.cents ?? null,
            sampleRate: context.sampleRate,
          });
        }

        animationRef.current = requestAnimationFrame(tick);
      };

      animationRef.current = requestAnimationFrame(tick);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start microphone capture.");
      stop();
    }
  }, [isActive, stop]);

  useEffect(() => stop, [stop]);

  return { frame, isActive, error, start, stop };
};
