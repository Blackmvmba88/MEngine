import {
  scoreAudienceRating,
  type RatingVectors,
  type TrackPackage,
} from "./catalog";

type RawAudienceVector = {
  id: string;
  style: string;
  popularity: number;
  engagement: number;
  momentum: number;
  explosiveness: number;
  longevity: number;
  age: number;
  ageAdjustedPerformance: number;
  likes: number;
  comments: number;
  reposts: number;
};

const log = (value: number): number => Math.log1p(Math.max(0, value));

const percentileMap = (
  rows: RawAudienceVector[],
  field: keyof Omit<RawAudienceVector, "id" | "style">,
): Map<string, number> => {
  if (!rows.length) return new Map();
  if (rows.length === 1) return new Map([[rows[0].id, 1]]);

  const values = rows.map((row) => row[field]).sort((a, b) => a - b);
  return new Map(
    rows.map((row) => {
      const value = row[field];
      let below = 0;
      let equal = 0;
      for (const candidate of values) {
        if (candidate < value) below += 1;
        else if (candidate === value) equal += 1;
      }
      const midpointRank = below + Math.max(0, equal - 1) / 2;
      const percentile = midpointRank / (values.length - 1);
      return [row.id, Math.max(0, Math.min(1, percentile))];
    }),
  );
};

const rawRow = (track: TrackPackage): RawAudienceVector => {
  const a = track.audience;
  const plays = Math.max(0, a.playsLifetime ?? 0);
  const ageDays = Math.max(1, a.ageDays ?? 1);
  const plays7d = Math.max(0, a.plays7d ?? 0);
  const plays30d = Math.max(0, a.plays30d ?? plays7d);
  const likes = Math.max(0, a.likes ?? 0);
  const comments = Math.max(0, a.comments ?? 0);
  const reposts = Math.max(0, a.reposts ?? 0);

  const lifetimeDaily = plays / ageDays;
  const recentDaily7 =
    a.plays7d === undefined ? lifetimeDaily : plays7d / 7;
  const recentDaily30 =
    a.plays30d === undefined ? lifetimeDaily : plays30d / 30;

  const interactions = likes + comments * 2 + reposts * 1.5;
  const engagement = interactions / (plays + 100);
  const momentum = recentDaily7 / Math.max(0.1, recentDaily30);
  const sustained = recentDaily30 / Math.max(0.1, lifetimeDaily);

  return {
    id: track.id,
    style: track.metadata.style.trim().toLowerCase() || "unknown",
    popularity: log(plays),
    engagement,
    momentum,
    explosiveness: log(recentDaily7),
    longevity:
      a.plays30d === undefined
        ? log(plays) * log(ageDays + 1)
        : sustained * log(ageDays + 1),
    age: ageDays,
    ageAdjustedPerformance: log(plays) / Math.sqrt(ageDays),
    likes: log(likes),
    comments: log(comments),
    reposts: log(reposts),
  };
};

const stylePerformance = (
  rows: RawAudienceVector[],
): Map<string, number> => {
  const groups = new Map<string, RawAudienceVector[]>();
  for (const row of rows) {
    groups.set(row.style, [...(groups.get(row.style) ?? []), row]);
  }

  const out = new Map<string, number>();
  for (const group of groups.values()) {
    const ranked = percentileMap(group, "ageAdjustedPerformance");
    for (const [id, value] of ranked) out.set(id, value);
  }
  return out;
};

export const deriveAudienceVectors = (
  tracks: TrackPackage[],
): Map<string, RatingVectors> => {
  const rows = tracks.map(rawRow);
  const popularity = percentileMap(rows, "popularity");
  const engagement = percentileMap(rows, "engagement");
  const momentum = percentileMap(rows, "momentum");
  const explosiveness = percentileMap(rows, "explosiveness");
  const longevity = percentileMap(rows, "longevity");
  const age = percentileMap(rows, "age");
  const ageAdjustedPerformance = percentileMap(rows, "ageAdjustedPerformance");
  const likes = percentileMap(rows, "likes");
  const comments = percentileMap(rows, "comments");
  const reposts = percentileMap(rows, "reposts");
  const style = stylePerformance(rows);

  return new Map(
    tracks.map((track) => [
      track.id,
      {
        ...track.ratings.vectors,
        popularity: popularity.get(track.id) ?? 0,
        engagement: engagement.get(track.id) ?? 0,
        momentum: momentum.get(track.id) ?? 0,
        explosiveness: explosiveness.get(track.id) ?? 0,
        longevity: longevity.get(track.id) ?? 0,
        age: age.get(track.id) ?? 0,
        ageAdjustedPerformance: ageAdjustedPerformance.get(track.id) ?? 0,
        stylePerformance: style.get(track.id) ?? 0,
        likesStrength: likes.get(track.id) ?? 0,
        commentsStrength: comments.get(track.id) ?? 0,
        repostsStrength: reposts.get(track.id) ?? 0,
      },
    ]),
  );
};

export const applyAudienceVectors = (
  tracks: TrackPackage[],
): TrackPackage[] => {
  const vectors = deriveAudienceVectors(tracks);
  return tracks.map((track) => ({
    ...track,
    ratings: {
      ...track.ratings,
      vectors: vectors.get(track.id) ?? track.ratings.vectors,
    },
  }));
};

export type TrackVectorName =
  | "explosiveness"
  | "longevity"
  | "popularity"
  | "engagement"
  | "momentum"
  | "age"
  | "ageAdjustedPerformance"
  | "stylePerformance"
  | "likesStrength"
  | "commentsStrength"
  | "repostsStrength"
  | "energy"
  | "styleStrength"
  | "originality"
  | "rhythmicComplexity"
  | "danceability";

export const rankTracksByVector = (
  tracks: TrackPackage[],
  vector: TrackVectorName,
): TrackPackage[] =>
  [...tracks].sort(
    (a, b) =>
      (b.ratings.vectors[vector] ?? 0) -
      (a.ratings.vectors[vector] ?? 0),
  );

export type CatalogRankMetric =
  | "audienceRating"
  | "myRating"
  | "plays"
  | "likes"
  | "comments"
  | "reposts"
  | "explosiveness"
  | "momentum"
  | "longevity"
  | "age"
  | "ageAdjustedPerformance"
  | "stylePerformance"
  | "engagement"
  | "popularity"
  | "bpm"
  | "wpm"
  | "energy"
  | "danceability"
  | "rhythmicComplexity"
  | "styleStrength"
  | "originality";

export const CATALOG_RANK_LABELS: Record<CatalogRankMetric, string> = {
  audienceRating: "Audience Rating",
  myRating: "My Rating",
  plays: "Plays",
  likes: "Likes",
  comments: "Comments",
  reposts: "Reposts",
  explosiveness: "Explosiveness",
  momentum: "Momentum",
  longevity: "Longevity",
  age: "Age",
  ageAdjustedPerformance: "Age-adjusted performance",
  stylePerformance: "Style performance",
  engagement: "Engagement",
  popularity: "Popularity",
  bpm: "BPM",
  wpm: "WPM",
  energy: "Energy",
  danceability: "Danceability",
  rhythmicComplexity: "Rhythmic complexity",
  styleStrength: "Style strength",
  originality: "Originality",
};

export const catalogRankValue = (
  track: TrackPackage,
  metric: CatalogRankMetric,
): number => {
  switch (metric) {
    case "audienceRating":
      return track.ratings.audienceRating ?? scoreAudienceRating(track.ratings.vectors);
    case "myRating":
      return track.ratings.myRating ?? 0;
    case "plays":
      return track.audience.playsLifetime ?? 0;
    case "likes":
      return track.audience.likes ?? 0;
    case "comments":
      return track.audience.comments ?? 0;
    case "reposts":
      return track.audience.reposts ?? 0;
    case "bpm":
      return track.technical.bpm ?? 0;
    case "wpm":
      return track.technical.wpm ?? 0;
    case "energy":
      return track.technical.energy ?? track.ratings.vectors.energy ?? 0;
    default:
      return track.ratings.vectors[metric] ?? 0;
  }
};

export const rankTracks = (
  tracks: TrackPackage[],
  metric: CatalogRankMetric,
): TrackPackage[] =>
  [...tracks].sort((a, b) => {
    const delta = catalogRankValue(b, metric) - catalogRankValue(a, metric);
    if (delta !== 0) return delta;
    return a.metadata.title.localeCompare(b.metadata.title);
  });

export const formatCatalogRankValue = (
  track: TrackPackage,
  metric: CatalogRankMetric,
): string => {
  const value = catalogRankValue(track, metric);
  if (["explosiveness", "momentum", "longevity", "ageAdjustedPerformance", "stylePerformance", "engagement", "popularity", "energy", "danceability", "rhythmicComplexity", "styleStrength", "originality"].includes(metric)) {
    return `${Math.round(value * 100)}%`;
  }
  if (metric === "audienceRating" || metric === "myRating") {
    return `${value.toFixed(metric === "myRating" ? 0 : 2)}/5`;
  }
  if (metric === "age") {
    return `${track.audience.ageDays ?? 0} d`;
  }
  if (metric === "bpm") return `${Math.round(value)} BPM`;
  if (metric === "wpm") return `${Math.round(value)} WPM`;
  return new Intl.NumberFormat().format(Math.round(value));
};
