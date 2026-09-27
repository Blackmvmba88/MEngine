import {
  evaluateDistributionGate,
  type TrackPackage,
} from "./catalog";

export type MissingSeverity = "blocker" | "warning" | "info";

export type MissingStateEvent = {
  type: string;
  severity: MissingSeverity;
  label: string;
  detail?: string;
};

export type MissingStateOptions = {
  includeOptional?: boolean;
  includeAnalysis?: boolean;
};

const analysisEvents = (track: TrackPackage): MissingStateEvent[] => {
  const out: MissingStateEvent[] = [];
  const add = (field: string, value: unknown, label: string) => {
    if (value === undefined || value === null || value === "") {
      out.push({
        type: `track.analysis.${field}_missing`,
        severity: "warning",
        label,
        detail: "Recommended analysis is not available yet",
      });
    }
  };

  add("bpm", track.technical.bpm, "BPM");
  add("key", track.technical.key, "Key");
  add("energy", track.technical.energy, "Energy");
  add("wpm", track.technical.wpm, "Words per minute");
  return out;
};

export const detectMissingState = (
  track: TrackPackage,
  options: MissingStateOptions = {},
): MissingStateEvent[] => {
  const gate = evaluateDistributionGate(track);
  const events: MissingStateEvent[] = gate.missingRequired.map((check) => ({
    type: check.id.startsWith("cover") || check.id === "audio" || check.id === "video"
      ? `track.asset.${check.id}_missing`
      : `track.metadata.${check.id}_missing`,
    severity: "blocker",
    label: check.label,
    detail: "Required before distribution",
  }));

  if (options.includeOptional && !track.assets.lyrics) {
    events.push({
      type: "track.lyrics.absent_optional",
      severity: "info",
      label: "Lyrics",
      detail: "Optional — absence does not block distribution",
    });
  }

  if (options.includeAnalysis !== false) {
    events.push(...analysisEvents(track));
  }

  if (gate.ready) {
    events.push({
      type: "track.ready_for_distribution",
      severity: "info",
      label: "Distribution gate",
      detail: "All required fields and assets are present",
    });
  }

  return events;
};

export const blockersOnly = (events: MissingStateEvent[]): MissingStateEvent[] =>
  events.filter((event) => event.severity === "blocker");
