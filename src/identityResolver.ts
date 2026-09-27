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

const extension = (name: string): string =>
  name.toLowerCase().split(".").pop() ?? "";

const stem = (name: string): string =>
  name.replace(/\.[^.]+$/, "");

const stripAssetTokens = (value: string): string =>
  value
    .replace(/^\d{4}[-_.]\d{2}[-_.]\d{2}[-_ ]*/, "")
    .replace(/\[(?:suno|audio|video|cover|artwork)\]/gi, " ")
    .replace(
      /(?:^|[-_ ])(?:cover|artwork|art|square|1x1|3000x3000|wide|widescreen|panoramic|panorama|pano|16x9|16-9|video|official|visualizer|lyrics?|karaoke)(?:$|[-_ ])/gi,
      " ",
    );

export const normalizeTrackKey = (name: string): string =>
  stripAssetTokens(stem(name))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");

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
  stripAssetTokens(stem(file.name))
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const attachAsset = (assets: TrackAssets, kind: AssetKind, file: FileCandidate) => {
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

export const resolveTrackIdentities = (files: FileCandidate[]): IdentityMatch[] => {
  const audioFiles = files.filter((file) => classifyCandidate(file) === "audio");
  const groups = new Map<string, IdentityMatch>();

  for (const audio of audioFiles) {
    const key = normalizeTrackKey(audio.name);
    if (!key) continue;
    const group: IdentityMatch = groups.get(key) ?? {
      key,
      displayTitle: displayTitle(audio),
      confidence: "exact",
      confidenceScore: 1,
      assets: {},
      unresolved: [],
    };
    attachAsset(group.assets, "audio", audio);
    groups.set(key, group);
  }

  for (const file of files) {
    if (classifyCandidate(file) === "audio") continue;

    const fileKey = normalizeTrackKey(file.name);
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

    if (!target || score < 0.5) {
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
      continue;
    }

    const kind = classifyCandidate(file);
    const attached = attachAsset(target.assets, kind, file);
    if (!attached) target.unresolved.push(file);

    if (score < 1) {
      target.confidence = score >= 0.75 ? "probable" : "review";
      target.confidenceScore = Math.min(target.confidenceScore, score);
    }
  }

  return [...groups.values()].sort((a, b) =>
    a.displayTitle.localeCompare(b.displayTitle),
  );
};
