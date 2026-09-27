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
  const identities = resolveTrackIdentities(
    files,
    tracks.map((track) => ({
      key: track.metadata.title,
      displayTitle: track.metadata.title,
    })),
  );
  const byKey = new Map(
    identities.map((identity) => [identity.key, identity]),
  );

  const records = tracks.map((source) => {
    const identity = byKey.get(trackKey(source));
    const track = mergeIdentity(source, identity);
    const events = detectMissingState(track, {
      includeOptional: false,
      includeAnalysis: true,
    });
    const readyForDistribution = evaluateDistributionGate(track).ready;

    return {
      track,
      identity,
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
): AutomatorCatalogEvent[] =>
  record.events.map((event) => ({
    kind: event.type,
    project: "music-catalog",
    source: "mengine",
    payload: {
      track_id: record.track.id,
      title: record.track.metadata.title,
      severity: event.severity,
      label: event.label,
      detail: event.detail,
      distribution_ready: record.readyForDistribution,
    },
  }));
