import type { AssetRef, TrackAssets } from "./catalog";

export type AssetKind =
  | "audio"
  | "coverSquare"
  | "coverPanoramic"
  | "video"
  | "lyrics"
  | "unknown";

export type FileCandidate = AssetRef & {
  name: string;
};

export type IdentityAnchor = {
  key: string;
  displayTitle: string;
};

export type IdentityMatch = {
  key: string;
  displayTitle: string;
  confidence: "exact" | "probable" | "review";
  confidenceScore: number;
  assets: TrackAssets;
  unresolved: FileCandidate[];
};

const AUDIO_EXT = new Set(["wav", "mp3", "flac", "m4a", "aiff", "aif", "ogg"]);
const VIDEO_EXT = new Set(["mp4", "mov", "mkv", "webm", "m4v"]);
const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp"]);
const LYRIC_EXT = new Set(["txt", "lrc", "srt", "vtt"]);

const ASSET_TOKENS = new Set([
  "audio",
  "cover",
  "artwork",
  "art",
  "square",
  "1x1",
  "3000x3000",
  "wide",
  "widescreen",
  "panoramic",
  "panorama",
  "pano",
  "16x9",
  "16-9",
  "video",
  "official",
  "visualizer",
  "lyric",
  "lyrics",
  "karaoke",
  "suno",
]);

const extension = (name: string): string =>
  name.toLowerCase().split(".").pop() ?? "";

const stem = (name: string): string =>
  name.replace(/\.[^.]+$/, "");

const normalizeWords = (value: string): string[] =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export const normalizeTrackKey = (name: string): string =>
  normalizeWords(stem(name)).join("-");

export const normalizeAssetKey = (name: string): string => {
  const withoutDate = stem(name)
    .replace(/^\d{4}[-_.]\d{2}[-_.]\d{2}[-_ ]*/, "")
    .replace(/\[(?:suno|audio|video|cover|artwork)\]/gi, " ");

  return normalizeWords(withoutDate)
    .filter((token) => !ASSET_TOKENS.has(token))
    .join("-");
};

const tokenize = (key: string): Set<string> =>
  new Set(key.split("-").filter(Boolean));

const similarity = (a: string, b: string): number => {
  if (a === b) return 1;
  const aa = tokenize(a);
  const bb = tokenize(b);
  const union = new Set([...aa, ...bb]);
  if (!union.size) return 0;

  let intersection = 0;
  for (const token of aa) {
    if (bb.has(token)) intersection += 1;
  }
  return intersection / union.size;
};

export const classifyCandidate = (file: FileCandidate): AssetKind => {
  const ext = extension(file.name);
  const lower = file.name.toLowerCase();

  if (AUDIO_EXT.has(ext)) return "audio";
  if (VIDEO_EXT.has(ext)) return "video";
  if (LYRIC_EXT.has(ext)) return "lyrics";

  if (IMAGE_EXT.has(ext)) {
    if (file.width && file.height) {
      if (file.width === file.height) return "coverSquare";
      if (file.width > file.height) return "coverPanoramic";
    }
    if (/(wide|widescreen|panoramic|panorama|pano|16x9|16-9)/.test(lower)) {
      return "coverPanoramic";
    }
    if (/(square|1x1|3000x3000|cover|artwork)/.test(lower)) {
      return "coverSquare";
    }
  }

  return "unknown";
};

const displayTitle = (file: FileCandidate): string =>
  normalizeAssetKey(file.name)
    .replace(/-/g, " ")
    .trim();

const attachAsset = (
  assets: TrackAssets,
  kind: AssetKind,
  file: FileCandidate,
): boolean => {
  if (kind === "unknown") return false;
  if (assets[kind]) return false;

  assets[kind] = {
    path: file.path,
    mimeType: file.mimeType,
    width: file.width,
    height: file.height,
    durationSeconds: file.durationSeconds,
  };
  return true;
};

export const resolveTrackIdentities = (
  files: FileCandidate[],
  anchors: IdentityAnchor[] = [],
): IdentityMatch[] => {
  const groups = new Map<string, IdentityMatch>();

  for (const anchor of anchors) {
    const key = normalizeTrackKey(anchor.key);
    if (!key || groups.has(key)) continue;
    groups.set(key, {
      key,
      displayTitle: anchor.displayTitle,
      confidence: "exact",
      confidenceScore: 1,
      assets: {},
      unresolved: [],
    });
  }

  const audioFiles = files.filter(
    (file) => classifyCandidate(file) === "audio",
  );

  for (const audio of audioFiles) {
    const key = normalizeAssetKey(audio.name);
    if (!key) continue;

    const group = groups.get(key) ?? {
      key,
      displayTitle: displayTitle(audio),
      confidence: "exact" as const,
      confidenceScore: 1,
      assets: {},
      unresolved: [],
    };

    if (!attachAsset(group.assets, "audio", audio)) {
      group.unresolved.push(audio);
      group.confidence = "review";
    }
    groups.set(key, group);
  }

  for (const file of files) {
    if (classifyCandidate(file) === "audio") continue;

    const fileKey = normalizeAssetKey(file.name);
    let target = groups.get(fileKey);
    let score = target ? 1 : 0;

    if (!target) {
      for (const candidate of groups.values()) {
        const next = similarity(fileKey, candidate.key);
        if (next > score) {
          score = next;
          target = candidate;
        }
      }
    }

    if (!target || score < 0.75) {
      if (target) {
        target.unresolved.push(file);
        target.confidence = "review";
        target.confidenceScore = Math.min(target.confidenceScore, score);
      } else {
        const orphanKey = fileKey || `review-${groups.size + 1}`;
        const orphan = groups.get(orphanKey) ?? {
          key: orphanKey,
          displayTitle: displayTitle(file),
          confidence: "review" as const,
          confidenceScore: score,
          assets: {},
          unresolved: [],
        };
        orphan.unresolved.push(file);
        groups.set(orphanKey, orphan);
      }
      continue;
    }

    const kind = classifyCandidate(file);
    const attached = attachAsset(target.assets, kind, file);
    if (!attached) {
      target.unresolved.push(file);
      target.confidence = "review";
      target.confidenceScore = Math.min(target.confidenceScore, score);
      continue;
    }

    if (score < 1 && target.confidence !== "review") {
      target.confidence = "probable";
      target.confidenceScore = Math.min(target.confidenceScore, score);
    }
  }

  return [...groups.values()].sort((a, b) =>
    a.displayTitle.localeCompare(b.displayTitle),
  );
};
