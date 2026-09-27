import type { TrackPackage } from "../catalog";
import { normalizeTrackKey } from "../identityResolver";

export type SoundCloudMetricRow = {
  soundcloudId: string;
  title: string | null;
  url: string | null;
  playbackCount: number | null;
  likesCount: number | null;
  commentCount: number | null;
  repostsCount: number | null;
  downloadCount?: number | null;
  createdAt?: string | null;
  capturedAt?: string | null;
  plays7d?: number | null;
  plays30d?: number | null;
};

export type SoundCloudMetricMatch = {
  trackId: string;
  soundcloudId: string;
  confidence: "id" | "exact-title" | "review";
};

export type SoundCloudCotejoMatch = {
  soundcloudId: string;
  soundcloudTitle?: string | null;
  soundcloudUrl?: string | null;
  localTrackId: string;
  localTitle?: string | null;
  durationConfirmed?: boolean;
  confidence: number;
};

const ageDays = (createdAt?: string | null, now = new Date()): number | undefined => {
  if (!createdAt) return undefined;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return undefined;
  return Math.max(1, Math.floor((now.getTime() - created.getTime()) / 86_400_000));
};

export const applySoundCloudCotejo = (
  tracks: TrackPackage[],
  matches: SoundCloudCotejoMatch[],
  minimumConfidence = 0.98,
): TrackPackage[] => {
  const byLocalId = new Map(
    tracks.map((track) => [track.sources?.localTrackId ?? track.id, track]),
  );

  const resolved = new Map<string, SoundCloudCotejoMatch>();
  for (const match of matches) {
    if (match.confidence < minimumConfidence) continue;
    if (match.durationConfirmed === false) continue;
    if (!byLocalId.has(match.localTrackId)) continue;
    resolved.set(match.localTrackId, match);
  }

  return tracks.map((track) => {
    const localId = track.sources?.localTrackId ?? track.id;
    const match = resolved.get(localId);
    if (!match) return track;
    return {
      ...track,
      sources: {
        ...track.sources,
        localTrackId: match.localTrackId,
        soundcloudId: match.soundcloudId,
        soundcloudUrl: match.soundcloudUrl ?? undefined,
      },
    };
  });
};

export const applySoundCloudMetrics = (
  tracks: TrackPackage[],
  rows: SoundCloudMetricRow[],
  now = new Date(),
): { tracks: TrackPackage[]; matches: SoundCloudMetricMatch[]; unmatched: SoundCloudMetricRow[] } => {
  const bySoundCloudId = new Map(
    tracks
      .filter((track) => track.sources?.soundcloudId)
      .map((track) => [track.sources!.soundcloudId!, track]),
  );
  const byTitle = new Map<string, TrackPackage[]>();
  for (const track of tracks) {
    const key = normalizeTrackKey(track.metadata.title);
    byTitle.set(key, [...(byTitle.get(key) ?? []), track]);
  }

  const rowByTrack = new Map<string, SoundCloudMetricRow>();
  const matches: SoundCloudMetricMatch[] = [];
  const unmatched: SoundCloudMetricRow[] = [];

  for (const row of rows) {
    const byId = bySoundCloudId.get(row.soundcloudId);
    if (byId) {
      rowByTrack.set(byId.id, row);
      matches.push({
        trackId: byId.id,
        soundcloudId: row.soundcloudId,
        confidence: "id",
      });
      continue;
    }

    const key = normalizeTrackKey(row.title ?? "");
    const candidates = byTitle.get(key) ?? [];
    if (candidates.length !== 1) {
      unmatched.push(row);
      continue;
    }
    const track = candidates[0];
    rowByTrack.set(track.id, row);
    matches.push({
      trackId: track.id,
      soundcloudId: row.soundcloudId,
      confidence: "exact-title",
    });
  }

  return {
    tracks: tracks.map((track) => {
      const row = rowByTrack.get(track.id);
      if (!row) return track;
      return {
        ...track,
        audience: {
          ...track.audience,
          playsLifetime: row.playbackCount ?? track.audience.playsLifetime,
          plays7d: row.plays7d ?? track.audience.plays7d,
          plays30d: row.plays30d ?? track.audience.plays30d,
          likes: row.likesCount ?? track.audience.likes,
          comments: row.commentCount ?? track.audience.comments,
          reposts: row.repostsCount ?? track.audience.reposts,
          ageDays: ageDays(row.createdAt, now) ?? track.audience.ageDays,
        },
      };
    }),
    matches,
    unmatched,
  };
};
