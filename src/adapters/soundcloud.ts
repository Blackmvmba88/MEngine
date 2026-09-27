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
};

export type SoundCloudMetricMatch = {
  trackId: string;
  soundcloudId: string;
  confidence: "exact-title" | "review";
};

const ageDays = (createdAt?: string | null, now = new Date()): number | undefined => {
  if (!createdAt) return undefined;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return undefined;
  return Math.max(1, Math.floor((now.getTime() - created.getTime()) / 86_400_000));
};

export const applySoundCloudMetrics = (
  tracks: TrackPackage[],
  rows: SoundCloudMetricRow[],
  now = new Date(),
): { tracks: TrackPackage[]; matches: SoundCloudMetricMatch[]; unmatched: SoundCloudMetricRow[] } => {
  const byTitle = new Map<string, TrackPackage[]>();
  for (const track of tracks) {
    const key = normalizeTrackKey(track.metadata.title);
    byTitle.set(key, [...(byTitle.get(key) ?? []), track]);
  }

  const rowByTrack = new Map<string, SoundCloudMetricRow>();
  const matches: SoundCloudMetricMatch[] = [];
  const unmatched: SoundCloudMetricRow[] = [];

  for (const row of rows) {
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
