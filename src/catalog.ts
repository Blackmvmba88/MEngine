export type AssetRef = {
  path: string;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  runtimeUrl?: string;
};

export type TrackAssets = {
  audio?: AssetRef;
  coverSquare?: AssetRef;
  coverPanoramic?: AssetRef;
  video?: AssetRef;
  lyrics?: AssetRef;
};

export type TrackMetadata = {
  title: string;
  artist: string;
  releaseType: "single" | "album" | "ep" | "other";
  album?: string;
  genre: string;
  style: string;
  motto: string;
  label: string;
  composer: string;
  producer: string;
  releaseDate: string;
  copyright: string;
  language?: string;
  explicit?: boolean;
  isrc?: string;
};

export type TechnicalVector = {
  bpm?: number;
  bpmConfidence?: number;
  key?: string;
  mode?: string;
  energy?: number;
  wpm?: number;
  tempoStability?: number;
  swing?: number;
  syncopation?: number;
  rhythmicComplexity?: number;
  danceability?: number;
  rms?: number;
  loudnessLufs?: number;
  dynamicRange?: number;
  spectralCentroid?: number;
  bassWeight?: number;
  harmonicDensity?: number;
  pitchRange?: number;
  vocalDensity?: number;
  silenceRatio?: number;
};

export type AudienceMetrics = {
  playsLifetime: number;
  plays30d?: number;
  plays7d?: number;
  playsToday?: number;
  likes?: number;
  comments?: number;
  reposts?: number;
  repeatListens?: number;
  ageDays?: number;
};

export type RatingVectors = {
  explosiveness?: number;
  longevity?: number;
  popularity?: number;
  engagement?: number;
  momentum?: number;
  age?: number;
  ageAdjustedPerformance?: number;
  stylePerformance?: number;
  likesStrength?: number;
  commentsStrength?: number;
  repostsStrength?: number;
  energy?: number;
  styleStrength?: number;
  originality?: number;
  rhythmicComplexity?: number;
  danceability?: number;
};

export type TrackRatings = {
  myRating?: 1 | 2 | 3 | 4 | 5;
  audienceRating?: number;
  vectors: RatingVectors;
};

export type TrackSources = {
  localTrackId?: string;
  sunoId?: string;
  soundcloudId?: string;
  soundcloudUrl?: string;
};

export type TrackPackage = {
  id: string;
  sources?: TrackSources;
  metadata: TrackMetadata;
  assets: TrackAssets;
  technical: TechnicalVector;
  audience: AudienceMetrics;
  ratings: TrackRatings;
};

export type GateCheck = {
  id: string;
  label: string;
  required: boolean;
  ok: boolean;
  detail?: string;
};

export type DistributionGate = {
  ready: boolean;
  label: "Distribute";
  checks: GateCheck[];
  missingRequired: GateCheck[];
};

const hasText = (value: string | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

const assetExists = (asset: AssetRef | undefined): boolean =>
  Boolean(asset && hasText(asset.path));

const squareIsValid = (asset: AssetRef | undefined): boolean => {
  if (!assetExists(asset)) return false;
  if (!asset?.width || !asset.height) return true;
  return asset.width === asset.height;
};

const panoramicIsValid = (asset: AssetRef | undefined): boolean => {
  if (!assetExists(asset)) return false;
  if (!asset?.width || !asset.height) return true;
  return asset.width > asset.height;
};

export const evaluateDistributionGate = (track: TrackPackage): DistributionGate => {
  const checks: GateCheck[] = [
    { id: "audio", label: "Audio master", required: true, ok: assetExists(track.assets.audio) },
    { id: "title", label: "Title", required: true, ok: hasText(track.metadata.title) },
    { id: "artist", label: "Artist", required: true, ok: hasText(track.metadata.artist) },
    { id: "releaseType", label: "Release type", required: true, ok: hasText(track.metadata.releaseType) },
    { id: "genre", label: "Genre", required: true, ok: hasText(track.metadata.genre) },
    { id: "style", label: "Style", required: true, ok: hasText(track.metadata.style) },
    { id: "motto", label: "Motto", required: true, ok: hasText(track.metadata.motto) },
    { id: "label", label: "Label", required: true, ok: hasText(track.metadata.label) },
    { id: "composer", label: "Composer", required: true, ok: hasText(track.metadata.composer) },
    { id: "producer", label: "Producer", required: true, ok: hasText(track.metadata.producer) },
    { id: "releaseDate", label: "Release date", required: true, ok: hasText(track.metadata.releaseDate) },
    { id: "copyright", label: "Copyright", required: true, ok: hasText(track.metadata.copyright) },
    { id: "coverSquare", label: "Cover 1:1", required: true, ok: squareIsValid(track.assets.coverSquare) },
    { id: "coverPanoramic", label: "Panoramic cover", required: true, ok: panoramicIsValid(track.assets.coverPanoramic) },
    { id: "video", label: "Video", required: true, ok: assetExists(track.assets.video) },
    {
      id: "lyrics",
      label: "Lyrics",
      required: false,
      ok: assetExists(track.assets.lyrics),
      detail: assetExists(track.assets.lyrics) ? "Present" : "Optional — not provided",
    },
    {
      id: "myRating",
      label: "My Rating",
      required: false,
      ok: track.ratings.myRating !== undefined,
      detail: "Editorial only — never blocks distribution",
    },
    {
      id: "audienceRating",
      label: "Audience Rating",
      required: false,
      ok: track.ratings.audienceRating !== undefined,
      detail: "Analytics only — never blocks distribution",
    },
  ];

  const missingRequired = checks.filter((check) => check.required && !check.ok);
  return {
    ready: missingRequired.length === 0,
    label: "Distribute",
    checks,
    missingRequired,
  };
};

const clamp01 = (value: number | undefined): number =>
  Math.max(0, Math.min(1, value ?? 0));

export const scoreAudienceRating = (vectors: RatingVectors): number => {
  const weighted =
    clamp01(vectors.explosiveness) * 0.25 +
    clamp01(vectors.popularity) * 0.20 +
    clamp01(vectors.engagement) * 0.20 +
    clamp01(vectors.momentum) * 0.20 +
    clamp01(vectors.longevity) * 0.15;

  return Number((1 + weighted * 4).toFixed(2));
};
