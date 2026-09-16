import {
  type CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LABELS,
  PANEL_ORDER,
  THEME_PRESETS,
  cssVariablesFromColors,
  type PanelLabels,
  type ThemeColors,
  type ThemePresetName,
  type VisualPanel,
} from "./theme";

const STORAGE_KEY = "blackmamba-mengine-ui-v1";

const COLOR_FIELDS: Array<{ key: keyof ThemeColors; label: string }> = [
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "panel", label: "Panel" },
  { key: "border", label: "Border" },
  { key: "text", label: "Text" },
  { key: "muted", label: "Muted" },
  { key: "accent", label: "Accent" },
  { key: "waveform", label: "Waveform" },
  { key: "fft", label: "FFT" },
  { key: "spectrogram", label: "Spectrogram" },
  { key: "pitch", label: "Pitch" },
  { key: "harmonics", label: "Harmonics" },
  { key: "phase", label: "Stereo Phase" },
  { key: "glow", label: "Glow" },
];

type StoredConfig = {
  preset: ThemePresetName;
  colors: ThemeColors;
  labels: PanelLabels;
  mainView: VisualPanel;
};

type ActivityItem = {
  id: number;
  time: string;
  action: string;
  detail: string;
};

const readStoredConfig = (): StoredConfig | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredConfig) : null;
  } catch {
    return null;
  }
};

const WaveformVisual = () => (
  <svg className="viz-svg waveform-svg" viewBox="0 0 1000 300" preserveAspectRatio="none">
    <defs>
      <linearGradient id="waveGradient" x1="0" x2="1">
        <stop offset="0" stopColor="var(--bm-waveform)" stopOpacity="0.35" />
        <stop offset="0.5" stopColor="var(--bm-waveform)" />
        <stop offset="1" stopColor="var(--bm-waveform)" stopOpacity="0.35" />
      </linearGradient>
    </defs>
    <path
      className="wave-shadow"
      d="M0 150 C35 148 45 80 75 150 S120 220 150 150 S185 112 220 150 S255 190 285 150 S320 28 360 150 S405 262 445 150 S480 94 520 150 S560 200 600 150 S635 60 675 150 S715 238 755 150 S805 116 845 150 S890 184 925 150 S965 82 1000 150"
    />
    <path
      className="wave-line"
      d="M0 150 C35 148 45 80 75 150 S120 220 150 150 S185 112 220 150 S255 190 285 150 S320 28 360 150 S405 262 445 150 S480 94 520 150 S560 200 600 150 S635 60 675 150 S715 238 755 150 S805 116 845 150 S890 184 925 150 S965 82 1000 150"
    />
  </svg>
);

const FFTVisual = () => (
  <div className="fft-bars" aria-hidden="true">
    {Array.from({ length: 56 }, (_, index) => {
      const height = 20 + ((index * 37 + index * index * 11) % 76);
      return (
        <span
          key={index}
          style={{
            height: `${height}%`,
            animationDelay: `${-(index % 12) * 0.07}s`,
          }}
        />
      );
    })}
  </div>
);

const SpectrogramVisual = () => (
  <div className="spectrogram" aria-hidden="true">
    <div className="spectrogram-scan" />
    {Array.from({ length: 12 }, (_, index) => (
      <span
        key={index}
        style={{
          left: `${4 + index * 8}%`,
          height: `${25 + ((index * 31) % 65)}%`,
          opacity: 0.18 + (index % 4) * 0.1,
        }}
      />
    ))}
  </div>
);

const PitchVisual = () => (
  <div className="pitch-wrap">
    <div className="pitch-note">A4</div>
    <div className="pitch-cents">+03 cents</div>
    <svg className="viz-svg pitch-svg" viewBox="0 0 1000 300" preserveAspectRatio="none">
      <path
        d="M0 185 C70 180 120 190 170 165 S275 125 330 150 S430 205 505 145 S625 85 690 120 S790 188 850 142 S930 105 1000 122"
      />
      <line x1="0" y1="150" x2="1000" y2="150" />
    </svg>
  </div>
);

const HarmonicsVisual = () => (
  <div className="harmonic-bars" aria-hidden="true">
    {Array.from({ length: 16 }, (_, index) => (
      <div className="harmonic-column" key={index}>
        <span style={{ height: `${92 / (1 + index * 0.18)}%` }} />
        <small>{index + 1}</small>
      </div>
    ))}
  </div>
);

const PhaseVisual = () => (
  <div className="phase-scope" aria-hidden="true">
    <span className="phase-axis phase-axis-x" />
    <span className="phase-axis phase-axis-y" />
    <span className="phase-orbit phase-orbit-a" />
    <span className="phase-orbit phase-orbit-b" />
    <span className="phase-core" />
  </div>
);

const renderVisual = (view: VisualPanel) => {
  switch (view) {
    case "waveform":
      return <WaveformVisual />;
    case "fft":
      return <FFTVisual />;
    case "spectrogram":
      return <SpectrogramVisual />;
    case "pitch":
      return <PitchVisual />;
    case "harmonics":
      return <HarmonicsVisual />;
    case "phase":
      return <PhaseVisual />;
  }
};

const App = () => {
  const stored = useMemo(readStoredConfig, []);
  const [preset, setPreset] = useState<ThemePresetName>(stored?.preset ?? "dark");
  const [colors, setColors] = useState<ThemeColors>(
    stored?.colors ?? THEME_PRESETS.dark.colors,
  );
  const [labels, setLabels] = useState<PanelLabels>(stored?.labels ?? DEFAULT_LABELS);
  const [mainView, setMainView] = useState<VisualPanel>(stored?.mainView ?? "spectrogram");
  const [activity, setActivity] = useState<ActivityItem[]>([
    { id: 1, time: "READY", action: "THEME ENGINE", detail: "UI state loaded" },
    { id: 2, time: "READY", action: "MAIN VIEW", detail: "Live preview online" },
    { id: 3, time: "READY", action: "CONFIG", detail: "Local persistence online" },
  ]);

  const cssVariables = useMemo(
    () => cssVariablesFromColors(colors) as CSSProperties,
    [colors],
  );

  useEffect(() => {
    const payload: StoredConfig = { preset, colors, labels, mainView };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [preset, colors, labels, mainView]);

  const log = (action: string, detail: string) => {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setActivity((items) => [
      { id: Date.now(), time: now, action, detail },
      ...items,
    ].slice(0, 7));
  };

  const applyPreset = (name: ThemePresetName) => {
    setPreset(name);
    setColors({ ...THEME_PRESETS[name].colors });
    log("THEME", `${THEME_PRESETS[name].name} applied`);
  };

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setColors((current) => ({ ...current, [key]: value }));
    log("COLOR", `${key} → ${value}`);
  };

  const updateLabel = (panel: VisualPanel, value: string) => {
    setLabels((current) => ({ ...current, [panel]: value }));
    log("PANEL", `${panel} renamed`);
  };

  const selectMainView = (view: VisualPanel) => {
    setMainView(view);
    log("MAIN VIEW", labels[view]);
  };

  const reset = () => {
    setPreset("dark");
    setColors({ ...THEME_PRESETS.dark.colors });
    setLabels({ ...DEFAULT_LABELS });
    setMainView("spectrogram");
    localStorage.removeItem(STORAGE_KEY);
    log("RESET", "BlackMamba defaults restored");
  };

  return (
    <main className="app-shell" style={cssVariables}>
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">BM</span>
          <div>
            <h1>MENGINE</h1>
            <p>BLACKMAMBA MUSIC ENGINE</p>
          </div>
        </div>
        <div className="identity-strip">
          <span>BLACKMAMBA RECORDS</span>
          <span>IYARI GOMEZ</span>
          <span className="status-dot">LIVE UI</span>
        </div>
      </header>

      <section className="workspace">
        <div className="engine-column">
          <nav className="view-tabs" aria-label="Main visualization">
            {PANEL_ORDER.map((view) => (
              <button
                className={view === mainView ? "active" : ""}
                key={view}
                onClick={() => selectMainView(view)}
              >
                {labels[view]}
              </button>
            ))}
          </nav>

          <section className="main-monitor">
            <div className="monitor-head">
              <div>
                <span className="eyebrow">MAIN VIEW</span>
                <h2>{labels[mainView]}</h2>
              </div>
              <div className="monitor-meta">
                <span>48 kHz</span>
                <span>24 bit</span>
                <span>AUTO</span>
              </div>
            </div>
            <div className={`visual visual-${mainView}`}>{renderVisual(mainView)}</div>
            <div className="monitor-footer">
              <span>INPUT · READY</span>
              <span>ENGINE · THEME CONTROL</span>
              <span>FPS · 60</span>
            </div>
          </section>

          <div className="mini-grid">
            {PANEL_ORDER.filter((view) => view !== mainView).map((view) => (
              <button
                className="mini-panel"
                key={view}
                onClick={() => selectMainView(view)}
              >
                <div className="mini-head">
                  <span>{labels[view]}</span>
                  <small>EXPAND</small>
                </div>
                <div className={`mini-visual visual-${view}`}>{renderVisual(view)}</div>
              </button>
            ))}
          </div>

          <section className="activity-panel">
            <div className="section-title">
              <span>ACTIVITY</span>
              <small>AUTOMATIC UI FEEDBACK</small>
            </div>
            <div className="activity-list">
              {activity.map((item) => (
                <div className="activity-row" key={item.id}>
                  <time>{item.time}</time>
                  <strong>{item.action}</strong>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="settings-panel">
          <div className="settings-head">
            <div>
              <span className="eyebrow">CONTROL</span>
              <h2>THEMES</h2>
            </div>
            <button className="reset-button" onClick={reset}>RESET</button>
          </div>

          <section className="settings-section">
            <div className="section-title">
              <span>PRESETS</span>
              <small>{THEME_PRESETS[preset].name}</small>
            </div>
            <div className="preset-grid">
              {(Object.keys(THEME_PRESETS) as ThemePresetName[]).map((name) => {
                const theme = THEME_PRESETS[name];
                return (
                  <button
                    key={name}
                    className={`preset-card ${preset === name ? "active" : ""}`}
                    onClick={() => applyPreset(name)}
                  >
                    <span
                      className="preset-swatch"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.background}, ${theme.colors.accent})`,
                      }}
                    />
                    <span>
                      <strong>{theme.name}</strong>
                      <small>{theme.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="settings-section">
            <div className="section-title">
              <span>COLORS</span>
              <small>LIVE</small>
            </div>
            <div className="color-table">
              {COLOR_FIELDS.map(({ key, label }) => (
                <label className="color-row" key={key}>
                  <span>{label}</span>
                  <input
                    className="color-picker"
                    type="color"
                    value={colors[key]}
                    onChange={(event) => updateColor(key, event.target.value)}
                  />
                  <input
                    className="hex-input"
                    value={colors[key]}
                    maxLength={7}
                    spellCheck={false}
                    onChange={(event) => updateColor(key, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="section-title">
              <span>PANEL NAMES</span>
              <small>EDITABLE</small>
            </div>
            <div className="label-table">
              {PANEL_ORDER.map((panel) => (
                <label key={panel}>
                  <span>{panel}</span>
                  <input
                    value={labels[panel]}
                    onChange={(event) => updateLabel(panel, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
};

export default App;
