export type ThemePresetName = "dark" | "silver" | "violet" | "ocean" | "princess";

export type VisualPanel =
  | "waveform"
  | "fft"
  | "spectrogram"
  | "pitch"
  | "harmonics"
  | "phase";

export type ThemeColors = {
  background: string;
  surface: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  waveform: string;
  fft: string;
  spectrogram: string;
  pitch: string;
  harmonics: string;
  phase: string;
  glow: string;
};

export type PanelLabels = Record<VisualPanel, string>;

export type ThemePreset = {
  id: ThemePresetName;
  name: string;
  description: string;
  colors: ThemeColors;
};

export const PANEL_ORDER: VisualPanel[] = [
  "waveform",
  "fft",
  "spectrogram",
  "pitch",
  "harmonics",
  "phase",
];

export const DEFAULT_LABELS: PanelLabels = {
  waveform: "Waveform",
  fft: "FFT",
  spectrogram: "Spectrogram",
  pitch: "Pitch",
  harmonics: "Harmonics",
  phase: "Stereo Phase",
};

export const THEME_PRESETS: Record<ThemePresetName, ThemePreset> = {
  dark: {
    id: "dark",
    name: "BlackMamba",
    description: "Black / toxic green",
    colors: {
      background: "#040706",
      surface: "#08100d",
      panel: "#0d1713",
      border: "#1c362a",
      text: "#f4fff9",
      muted: "#7c9b8c",
      accent: "#76ff9f",
      waveform: "#76ff9f",
      fft: "#c4ff4f",
      spectrogram: "#38f5ff",
      pitch: "#ffcf5c",
      harmonics: "#ad7cff",
      phase: "#ff5dc8",
      glow: "#45ff88",
    },
  },
  silver: {
    id: "silver",
    name: "Silver",
    description: "Metal / neutral",
    colors: {
      background: "#090a0c",
      surface: "#15171a",
      panel: "#20242a",
      border: "#4b535d",
      text: "#f4f6f8",
      muted: "#9aa2aa",
      accent: "#dce4ec",
      waveform: "#f7f9fb",
      fft: "#b9c7d4",
      spectrogram: "#87d9ff",
      pitch: "#ffdf8c",
      harmonics: "#d0b8ff",
      phase: "#ff9fca",
      glow: "#cfd8e3",
    },
  },
  violet: {
    id: "violet",
    name: "Violet",
    description: "Purple / neon",
    colors: {
      background: "#08050d",
      surface: "#120a1d",
      panel: "#1b1030",
      border: "#4f2f76",
      text: "#fbf4ff",
      muted: "#aa93bd",
      accent: "#b56cff",
      waveform: "#d782ff",
      fft: "#7cf6ff",
      spectrogram: "#ff5fd1",
      pitch: "#fff275",
      harmonics: "#9d7cff",
      phase: "#6dffbc",
      glow: "#b760ff",
    },
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Deep blue / cyan",
    colors: {
      background: "#02080f",
      surface: "#06131e",
      panel: "#0a1f2e",
      border: "#15425d",
      text: "#eafaff",
      muted: "#74a0b2",
      accent: "#31d7ff",
      waveform: "#3ef0ff",
      fft: "#4ba8ff",
      spectrogram: "#20ffc8",
      pitch: "#f7df6e",
      harmonics: "#8a7dff",
      phase: "#ff6bb5",
      glow: "#2bdcff",
    },
  },
  princess: {
    id: "princess",
    name: "Princess",
    description: "Pink / pearl / lavender",
    colors: {
      background: "#100914",
      surface: "#1c1023",
      panel: "#291531",
      border: "#744f80",
      text: "#fff7ff",
      muted: "#c5a9cb",
      accent: "#ff9de2",
      waveform: "#ff8bd8",
      fft: "#a7e8ff",
      spectrogram: "#c6a2ff",
      pitch: "#ffe49d",
      harmonics: "#ffb8f0",
      phase: "#8ff5e3",
      glow: "#ff8bd8",
    },
  },
};

export const cssVariablesFromColors = (colors: ThemeColors) =>
  ({
    "--bm-background": colors.background,
    "--bm-surface": colors.surface,
    "--bm-panel": colors.panel,
    "--bm-border": colors.border,
    "--bm-text": colors.text,
    "--bm-muted": colors.muted,
    "--bm-accent": colors.accent,
    "--bm-waveform": colors.waveform,
    "--bm-fft": colors.fft,
    "--bm-spectrogram": colors.spectrogram,
    "--bm-pitch": colors.pitch,
    "--bm-harmonics": colors.harmonics,
    "--bm-phase": colors.phase,
    "--bm-glow": colors.glow,
  }) as Record<string, string>;
