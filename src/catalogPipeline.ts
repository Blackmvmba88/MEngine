import type { TrackPackage } from "./catalog";
import { evaluateDistributionGate } from "./catalog";
import {
  normalizeTrackKey,
  resolveTrackIdentities,
  type FileCandidate,
  type IdentityMatch,
} from "./identityResolver";
import {
  detectMissingState,
  type MissingStateEvent,
} from "./missingState";

export type CatalogRecord = {
  track: TrackPackage;
  identity?: IdentityMatch;
  identityAmbiguous: boolean;
  events: MissingStateEvent[];
  readyForDistribution: boolean;
};

export type CatalogReport = {
  tracks: CatalogRecord[];
  ready: CatalogRecord[];
  blocked: CatalogRecord[];
  needsReview: CatalogRecord[];
};

const trackKey = (track: TrackPackage): string =>
  normalizeTrackKey(track.metadata.title);

const mergeIdentity = (
  track: TrackPackage,
  identity: IdentityMatch | undefined,
): TrackPackage => {
  if (!identity) return track;
  return {
    ...track,
    assets: {
      ...track.assets,
      ...Object.fromEntries(
        Object.entries(identity.assets).filter(([, value]) => value !== undefined),
      ),
    },
  };
};

export const buildCatalogReport = (
  tracks: TrackPackage[],
  files: FileCandidate[] = [],
): CatalogReport => {
  const keyCounts = new Map<string, number>();
  for (const track of tracks) {
    const key = trackKey(track);
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }

  const uniqueAnchors = tracks
    .filter((track) => (keyCounts.get(trackKey(track)) ?? 0) === 1)
    .map((track) => ({
      key: track.metadata.title,
      displayTitle: track.metadata.title,
    }));

  const identities = resolveTrackIdentities(files, uniqueAnchors);
  const byKey = new Map(
    identities.map((identity) => [identity.key, identity]),
  );

  const records = tracks.map((source) => {
    const key = trackKey(source);
    const identityAmbiguous = (keyCounts.get(key) ?? 0) > 1;
    const identity = identityAmbiguous ? undefined : byKey.get(key);
    const track = mergeIdentity(source, identity);
    const events = detectMissingState(track, {
      includeOptional: false,
      includeAnalysis: true,
    });
    const readyForDistribution = evaluateDistributionGate(track).ready;

    return {
      track,
      identity,
      identityAmbiguous,
      events,
      readyForDistribution,
    };
  });

  return {
    tracks: records,
    ready: records.filter((record) => record.readyForDistribution),
    blocked: records.filter((record) => !record.readyForDistribution),
    needsReview: records.filter(
      (record) =>
        record.identityAmbiguous ||
        record.identity?.confidence === "review" ||
        Boolean(record.identity?.unresolved.length),
    ),
  };
};

export type AutomatorCatalogEvent = {
  kind: string;
  project: "music-catalog";
  source: "mengine";
  payload: Record<string, unknown>;
};

export const toAutomatorEvents = (
  record: CatalogRecord,
): AutomatorCatalogEvent[] => {
  const events: AutomatorCatalogEvent[] = record.events.map((event) => ({
    kind: event.type,
    project: "music-catalog" as const,
    source: "mengine" as const,
    payload: {
      track_id: record.track.id,
      title: record.track.metadata.title,
      severity: event.severity,
      label: event.label,
      detail: event.detail,
      distribution_ready: record.readyForDistribution,
    },
  }));

  if (record.identityAmbiguous) {
    events.push({
      kind: "track.identity.ambiguous",
      project: "music-catalog",
      source: "mengine",
      payload: {
        track_id: record.track.id,
        title: record.track.metadata.title,
        severity: "warning",
        label: "Duplicate title requires ID/evidence review",
        distribution_ready: record.readyForDistribution,
      },
    });
  }

  return events;
};
