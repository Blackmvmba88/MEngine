import { useMemo, useState } from "react";
import {
  evaluateDistributionGate,
  scoreAudienceRating,
  type TrackMetadata,
  type TrackPackage,
} from "./catalog";
import { ENGINE_MODES, type EngineMode } from "./capabilityRegistry";
import { buildCatalogReport, type CatalogReport } from "./catalogPipeline";
import { tracksFromSunoManifest, type SunoManifestRow } from "./adapters/sunoSuite";
import { tracksFromCanonicalLibrary, type CanonicalLibrary } from "./adapters/canonicalLibrary";
import type { FileCandidate } from "./identityResolver";
import { handoffDistribution } from "./distribution";

type Props = {
  onActivity?: (action: string, detail: string) => void;
};

const INITIAL_METADATA: TrackMetadata = {
  title: "Frequency",
  artist: "Iyari Gomez",
  releaseType: "single",
  album: "Frequency",
  genre: "Reggae",
  style: "Virtuoso Fast Reggae / Operatic Vocal",
  motto: "Resonate beyond the limit",
  label: "BlackMamba Records",
  composer: "Iyari Gomez",
  producer: "Iyari Gomez",
  releaseDate: "2026-09-27",
  copyright: "© 2026 BlackMamba Records",
  language: "English",
  explicit: false,
};

const INITIAL_TRACK: TrackPackage = {
  id: "frequency-demo",
  metadata: INITIAL_METADATA,
  assets: {
    audio: { path: "Frequency.wav", mimeType: "audio/wav" },
    coverSquare: { path: "Frequency-cover-1x1.png", width: 3000, height: 3000 },
    coverPanoramic: { path: "Frequency-cover-wide.png", width: 1920, height: 1080 },
    video: { path: "Frequency-video.mp4", mimeType: "video/mp4" },
  },
  technical: {
    bpm: 148,
    bpmConfidence: 0.94,
    key: "F#",
    mode: "minor",
    energy: 0.91,
    wpm: 164,
    tempoStability: 0.96,
    rhythmicComplexity: 0.82,
    danceability: 0.87,
    bassWeight: 0.79,
    harmonicDensity: 0.84,
  },
  audience: {
    playsLifetime: 22481,
    plays30d: 4208,
    plays7d: 1391,
    playsToday: 187,
    likes: 468,
    comments: 21,
    reposts: 36,
    ageDays: 18,
  },
  ratings: {
    myRating: 5,
    vectors: {
      explosiveness: 0.92,
      popularity: 0.84,
      engagement: 0.71,
      momentum: 0.88,
      longevity: 0.54,
      energy: 0.91,
      styleStrength: 0.97,
      originality: 0.90,
      rhythmicComplexity: 0.82,
      danceability: 0.87,
    },
  },
};

const clampPercent = (value?: number) =>
  value === undefined ? "—" : `${Math.round(value * 100)}`;

const formatNumber = (value?: number) =>
  value === undefined ? "—" : new Intl.NumberFormat().format(value);

export const TrackConsole = ({ onActivity }: Props) => {
  const [mode, setMode] = useState<EngineMode>("player");
  const [track, setTrack] = useState<TrackPackage>(() => ({
    ...INITIAL_TRACK,
    metadata: { ...INITIAL_TRACK.metadata },
    assets: { ...INITIAL_TRACK.assets },
    technical: { ...INITIAL_TRACK.technical },
    audience: { ...INITIAL_TRACK.audience },
    ratings: {
      ...INITIAL_TRACK.ratings,
      vectors: { ...INITIAL_TRACK.ratings.vectors },
    },
  }));
  const [proInstrument, setProInstrument] = useState("Guitar");
  const [catalogTracks, setCatalogTracks] = useState<TrackPackage[]>([]);
  const [assetCandidates, setAssetCandidates] = useState<FileCandidate[]>([]);
  const [catalogReport, setCatalogReport] = useState<CatalogReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [catalogSource, setCatalogSource] = useState<string>("");
  const [distributionState, setDistributionState] = useState<"idle" | "sending" | "queued" | "error">("idle");
  const [distributionDetail, setDistributionDetail] = useState<string>("");

  const audienceRating = useMemo(
    () => scoreAudienceRating(track.ratings.vectors),
    [track.ratings.vectors],
  );

  const gate = useMemo(
    () =>
      evaluateDistributionGate({
        ...track,
        ratings: { ...track.ratings, audienceRating },
      }),
    [track, audienceRating],
  );

  const rebuildCatalog = (tracks: TrackPackage[], files: FileCandidate[]) => {
    const report = buildCatalogReport(tracks, files);
    setCatalogReport(report);
    onActivity?.(
      "CATALOG SCAN",
      `${report.tracks.length} tracks · ${report.ready.length} ready · ${report.blocked.length} blocked · ${report.needsReview.length} review`,
    );
  };

  const importCatalog = async (file: File | undefined) => {
    if (!file) return;
    setImportError(null);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const defaults = {
        artist: track.metadata.artist,
        label: track.metadata.label,
        composer: track.metadata.composer,
        producer: track.metadata.producer,
      };

      let tracks: TrackPackage[];
      let source: string;

      if (Array.isArray(parsed)) {
        tracks = tracksFromSunoManifest(parsed as SunoManifestRow[], {
          ...defaults,
          style: track.metadata.style,
          motto: track.metadata.motto,
        });
        source = "SUNO MANIFEST";
      } else if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as CanonicalLibrary).tracks)
      ) {
        tracks = tracksFromCanonicalLibrary(parsed as CanonicalLibrary, defaults);
        source = "CANONICAL LIBRARY";
      } else {
        throw new Error("Unsupported catalog JSON: expected Suno array or { tracks: [...] }");
      }

      setCatalogSource(source);
      setCatalogTracks(tracks);
      rebuildCatalog(tracks, assetCandidates);
      onActivity?.("CATALOG IMPORT", `${source} · ${tracks.length} tracks`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Catalog import failed";
      setImportError(message);
      onActivity?.("CATALOG ERROR", message);
    }
  };

  const scanAssets = (files: FileList | null) => {
    if (!files?.length) return;
    const candidates: FileCandidate[] = Array.from(files).map((file) => ({
      name: file.name,
      path: file.webkitRelativePath || file.name,
      mimeType: file.type || undefined,
    }));
    setAssetCandidates(candidates);
    if (catalogTracks.length) {
      rebuildCatalog(catalogTracks, candidates);
    } else {
      onActivity?.(
        "ASSET SCAN",
        `${candidates.length} files indexed; import a catalog to build track packages`,
      );
    }
  };

  const setMetadata = <K extends keyof TrackMetadata>(
    key: K,
    value: TrackMetadata[K],
  ) => {
    setTrack((current) => ({
      ...current,
      metadata: { ...current.metadata, [key]: value },
    }));
  };

  const setMyRating = (rating: 1 | 2 | 3 | 4 | 5) => {
    setTrack((current) => ({
      ...current,
      ratings: { ...current.ratings, myRating: rating },
    }));
    onActivity?.("MY RATING", `${rating}/5 for ${track.metadata.title}`);
  };

  const selectMode = (next: EngineMode) => {
    setMode(next);
    onActivity?.("MODE", ENGINE_MODES[next].label);
  };

  const distribute = async () => {
    if (!gate.ready || distributionState === "sending") return;
    setDistributionState("sending");
    setDistributionDetail("Sending explicit distribution request to Automator…");

    const result = await handoffDistribution({
      ...track,
      ratings: { ...track.ratings, audienceRating },
    });

    if (result.ok) {
      setDistributionState("queued");
      setDistributionDetail(
        result.jobId ? `Queued as ${result.jobId}` : "Queued in BlackMamba Automator",
      );
      onActivity?.(
        "DISTRIBUTE",
        `${track.metadata.title} queued for distribution bundle preparation`,
      );
      return;
    }

    setDistributionState("error");
    setDistributionDetail(
      result.reason === "automator_unreachable"
        ? "Automator bridge is offline — run: bma serve"
        : result.reason,
    );
    onActivity?.("DISTRIBUTE ERROR", result.reason);
  };

  return (
    <section className="track-console">
      <div className="track-console-head">
        <div>
          <span className="eyebrow">CATALOG / CURRENT TRACK</span>
          <h2>{track.metadata.title}</h2>
          <p>{track.metadata.artist} · {track.metadata.genre} · {track.metadata.style}</p>
        </div>
        <button
          className={`distribute-button ${gate.ready ? "ready" : ""}`}
          disabled={!gate.ready || distributionState === "sending"}
          onClick={() => void distribute()}
          title={gate.ready ? "Eligible for explicit distribution handoff" : `${gate.missingRequired.length} required items missing`}
        >
          {distributionState === "sending"
            ? "QUEUING…"
            : distributionState === "queued"
              ? "DISTRIBUTE · QUEUED"
              : gate.ready
                ? "DISTRIBUTE"
                : `DISTRIBUTE · ${gate.missingRequired.length} MISSING`}
        </button>
        {distributionDetail ? (
          <div className={`distribution-status ${distributionState}`}>
            {distributionDetail}
          </div>
        ) : null}
      </div>

      <div className="catalog-import-bar">
        <label className="catalog-import-button">
          IMPORT CATALOG
          <input
            type="file"
            accept=".json,application/json"
            onChange={(event) => void importCatalog(event.target.files?.[0])}
          />
        </label>
        <label className="catalog-import-button">
          SCAN ASSETS
          <input
            type="file"
            multiple
            accept="audio/*,image/*,video/*,.lrc,.txt,.srt,.vtt"
            onChange={(event) => scanAssets(event.target.files)}
          />
        </label>
        {catalogReport ? (
          <div className="catalog-import-stats">
            <span><strong>{catalogReport.tracks.length}</strong> TRACKS</span>
            <span><strong>{catalogReport.ready.length}</strong> READY</span>
            <span><strong>{catalogReport.blocked.length}</strong> BLOCKED</span>
            <span><strong>{catalogReport.needsReview.length}</strong> REVIEW</span>
            {catalogSource ? <span><strong>{catalogSource}</strong></span> : null}
          </div>
        ) : (
          <span className="catalog-import-hint">Manifest + assets → identity → missing state → gate</span>
        )}
        {importError ? <span className="catalog-import-error">{importError}</span> : null}
      </div>

      <nav className="engine-mode-tabs" aria-label="Music Engine mode">
        {(Object.keys(ENGINE_MODES) as EngineMode[]).map((key) => (
          <button
            key={key}
            className={mode === key ? "active" : ""}
            onClick={() => selectMode(key)}
          >
            <strong>{ENGINE_MODES[key].label}</strong>
            <small>{ENGINE_MODES[key].purpose}</small>
          </button>
        ))}
      </nav>

      <div className="track-summary-grid">
        <div className="rating-card">
          <span>MY RATING</span>
          <div className="stars" aria-label="My rating">
            {([1, 2, 3, 4, 5] as const).map((star) => (
              <button
                key={star}
                className={(track.ratings.myRating ?? 0) >= star ? "active" : ""}
                onClick={() => setMyRating(star)}
                aria-label={`Rate ${star} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <strong>{track.ratings.myRating ?? "—"}/5</strong>
        </div>

        <div className="rating-card">
          <span>AUDIENCE RATING</span>
          <strong className="rating-big">{audienceRating.toFixed(2)}/5</strong>
          <small>Derived from audience vectors</small>
        </div>

        <div className="rating-card">
          <span>PLAYS</span>
          <strong className="rating-big">{formatNumber(track.audience.playsLifetime)}</strong>
          <small>7d {formatNumber(track.audience.plays7d)} · Today {formatNumber(track.audience.playsToday)}</small>
        </div>

        <div className="rating-card">
          <span>DISTRIBUTION GATE</span>
          <strong className={gate.ready ? "gate-ok" : "gate-warn"}>
            {gate.ready ? "READY" : "INCOMPLETE"}
          </strong>
          <small>{gate.ready ? "0 required items missing" : `${gate.missingRequired.length} required items missing`}</small>
        </div>
      </div>

      {mode === "player" && (
        <div className="mode-panel">
          <div className="vector-grid">
            <div><span>BPM</span><strong>{track.technical.bpm ?? "—"}</strong><small>{clampPercent(track.technical.bpmConfidence)}% confidence</small></div>
            <div><span>KEY</span><strong>{track.technical.key ?? "—"} {track.technical.mode ?? ""}</strong><small>tonal center</small></div>
            <div><span>ENERGY</span><strong>{clampPercent(track.technical.energy)}</strong><small>audio vector</small></div>
            <div><span>WPM</span><strong>{track.technical.wpm ?? "—"}</strong><small>vocal density</small></div>
            <div><span>EXPLOSIVENESS</span><strong>{clampPercent(track.ratings.vectors.explosiveness)}</strong><small>audience vector</small></div>
            <div><span>MOMENTUM</span><strong>{clampPercent(track.ratings.vectors.momentum)}</strong><small>recent growth</small></div>
            <div><span>STYLE</span><strong>{clampPercent(track.ratings.vectors.styleStrength)}</strong><small>style strength</small></div>
            <div><span>LONGEVITY</span><strong>{clampPercent(track.ratings.vectors.longevity)}</strong><small>age-adjusted</small></div>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <div className="mode-panel edit-mode-grid">
          <div className="metadata-editor">
            <label>Title<input value={track.metadata.title} onChange={(e) => setMetadata("title", e.target.value)} /></label>
            <label>Artist<input value={track.metadata.artist} onChange={(e) => setMetadata("artist", e.target.value)} /></label>
            <label>Genre<input value={track.metadata.genre} onChange={(e) => setMetadata("genre", e.target.value)} /></label>
            <label>Style<input value={track.metadata.style} onChange={(e) => setMetadata("style", e.target.value)} /></label>
            <label>Motto<input value={track.metadata.motto} onChange={(e) => setMetadata("motto", e.target.value)} /></label>
            <label>Label<input value={track.metadata.label} onChange={(e) => setMetadata("label", e.target.value)} /></label>
            <label>Composer<input value={track.metadata.composer} onChange={(e) => setMetadata("composer", e.target.value)} /></label>
            <label>Producer<input value={track.metadata.producer} onChange={(e) => setMetadata("producer", e.target.value)} /></label>
            <label>Release date<input type="date" value={track.metadata.releaseDate} onChange={(e) => setMetadata("releaseDate", e.target.value)} /></label>
            <label>Copyright<input value={track.metadata.copyright} onChange={(e) => setMetadata("copyright", e.target.value)} /></label>
          </div>

          <div className="gate-checklist">
            <div className="section-title">
              <span>MISSING STATE</span>
              <small>{gate.missingRequired.length} REQUIRED</small>
            </div>
            {gate.checks.map((check) => (
              <div className={`gate-row ${check.ok ? "ok" : check.required ? "missing" : "optional"}`} key={check.id}>
                <span>{check.ok ? "✓" : check.required ? "!" : "—"}</span>
                <strong>{check.label}</strong>
                <small>{check.required ? "Required" : check.detail ?? "Optional"}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "karaoke" && (
        <div className="mode-panel karaoke-panel">
          <span className="eyebrow">KARAOKE</span>
          {track.assets.lyrics ? (
            <>
              <h3>Lyrics available</h3>
              <p>Timed-word and syllable alignment can be loaded for this track.</p>
            </>
          ) : (
            <>
              <h3>No lyrics attached</h3>
              <p>This track remains fully playable and distribution-ready. Lyrics are optional and never block the gate.</p>
            </>
          )}
        </div>
      )}

      {mode === "pro" && (
        <div className="mode-panel pro-panel">
          <div className="pro-selector">
            <label>
              PRECISION PROFILE
              <select value={proInstrument} onChange={(e) => setProInstrument(e.target.value)}>
                <option>Guitar</option>
                <option>Bass</option>
                <option>Voice</option>
                <option>Piano</option>
                <option>Drums</option>
              </select>
            </label>
          </div>
          <div className="vector-grid">
            <div><span>INSTRUMENT</span><strong>{proInstrument}</strong><small>selected contract</small></div>
            <div><span>PITCH</span><strong>READY</strong><small>target vs performed</small></div>
            <div><span>TIMING</span><strong>READY</strong><small>onset precision</small></div>
            <div><span>ARTICULATION</span><strong>READY</strong><small>instrument-specific</small></div>
          </div>
        </div>
      )}
    </section>
  );
};
