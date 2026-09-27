export type EngineMode = "player" | "edit" | "karaoke" | "pro";

export type CapabilitySource = {
  id: string;
  repo: string;
  role: string;
  capabilities: string[];
  integration: "native" | "adapter" | "reference";
};

export const ENGINE_MODES: Record<EngineMode, { label: string; purpose: string }> = {
  player: {
    label: "Player",
    purpose: "Catalog playback, queue, artwork, metadata, metrics and technical vectors.",
  },
  edit: {
    label: "Edit",
    purpose: "Correct metadata, identity, timing, sections, lyrics alignment and assets.",
  },
  karaoke: {
    label: "Karaoke",
    purpose: "Timed lyrics/subtitles, translation and performance-following views.",
  },
  pro: {
    label: "Pro",
    purpose: "Instrument-specific precision, stems, pitch/timing and performance analysis.",
  },
};

export const CAPABILITY_SOURCES: CapabilitySource[] = [
  {
    id: "mengine",
    repo: "Blackmvmba88/MEngine",
    role: "Canonical host and visual/analysis control surface",
    capabilities: ["waveform", "fft", "spectrogram", "pitch", "harmonics", "phase", "MambaSpec"],
    integration: "native",
  },
  {
    id: "suno-suite",
    repo: "Blackmvmba88/suno-suite",
    role: "Catalog, manifests, QA, streaming and distribution preparation",
    capabilities: ["library", "manifests", "metadata workflow", "streaming", "DistroKid export", "remote control"],
    integration: "adapter",
  },
  {
    id: "reproductornuevo",
    repo: "Blackmvmba88/reproductornuevo",
    role: "Player/editor feature source",
    capabilities: ["playback", "playlist", "ID3 metadata", "waveform", "FFT", "subtitles", "translation", "media separation"],
    integration: "adapter",
  },
  {
    id: "rockhero",
    repo: "Blackmvmba88/Rockhero",
    role: "Musical analysis and educational/performance analysis source",
    capabilities: ["BPM", "beats", "key", "chords", "FFT", "energy bands", "stems"],
    integration: "adapter",
  },
  {
    id: "guitarra",
    repo: "Blackmvmba88/guitarra",
    role: "Instrument-specific performance source",
    capabilities: ["instrument selection", "note events", "attack detection", "controller performance", "precision scoring"],
    integration: "adapter",
  },
  {
    id: "voices",
    repo: "Blackmvmba88/voices",
    role: "Voice acoustic vector source",
    capabilities: ["F0", "pitch range", "spectral centroid", "HNR", "RMS", "formants", "MFCC", "voice texture"],
    integration: "adapter",
  },
  {
    id: "mastersong",
    repo: "Blackmvmba88/MasterSong",
    role: "Studio analysis/remastering source",
    capabilities: ["loudness", "RMS", "peak", "stems", "vocal pitch accuracy", "technical reports"],
    integration: "adapter",
  },
  {
    id: "dj-turntable",
    repo: "Blackmvmba88/dj-turntable-system",
    role: "DJ playback/control source",
    capabilities: ["dual deck", "pitch", "tempo", "EQ", "effects", "waveform", "playlist"],
    integration: "adapter",
  },
  {
    id: "key-changer",
    repo: "Blackmvmba88/cambiador-de-tonalid",
    role: "Pitch/key and BPM manipulation source",
    capabilities: ["key shift", "tempo", "BPM detection", "tap tempo", "loop", "export"],
    integration: "adapter",
  },
  {
    id: "reproductor-alecksey",
    repo: "Blackmvmba88/ReproductorAlecksey",
    role: "Legacy ingest and visualization source",
    capabilities: ["authorized media ingest", "FFmpeg conversion", "local playback", "FFT visualizer"],
    integration: "reference",
  },
];

export const capabilityIndex = (): Map<string, CapabilitySource[]> => {
  const index = new Map<string, CapabilitySource[]>();
  for (const source of CAPABILITY_SOURCES) {
    for (const capability of source.capabilities) {
      const key = capability.toLowerCase();
      index.set(key, [...(index.get(key) ?? []), source]);
    }
  }
  return index;
};
