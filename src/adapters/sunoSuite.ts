import type {
  TrackMetadata,
  TrackPackage,
} from "../catalog";

export type SunoManifestRow = {
  file_path: string;
  file_name?: string;
  proposed_title?: string;
  lyrics_excerpt?: string;
  language?: string;
  genre_guess?: string;
  cover_image?: string;
  explicit?: string;
  notes?: string;
};

export type SunoDefaults = {
  artist: string;
  label: string;
  composer: string;
  producer: string;
  style?: string;
  motto?: string;
};

const yes = (value?: string): boolean =>
  /^(1|true|yes|si|sí)$/i.test((value ?? "").trim());

const titleFromFile = (path: string): string => {
  const leaf = path.split(/[\\/]/).pop() ?? path;
  return leaf.replace(/\.[^.]+$/, "");
};

const stableId = (row: SunoManifestRow): string =>
  (row.file_path || row.file_name || row.proposed_title || "track")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

export const trackFromSunoManifest = (
  row: SunoManifestRow,
  defaults: SunoDefaults,
): TrackPackage => {
  const title = (row.proposed_title || titleFromFile(row.file_path)).trim();

  const metadata: TrackMetadata = {
    title,
    artist: defaults.artist,
    releaseType: "single",
    genre: (row.genre_guess ?? "").trim(),
    style: defaults.style ?? "",
    motto: defaults.motto ?? "",
    label: defaults.label,
    composer: defaults.composer,
    producer: defaults.producer,
    releaseDate: "",
    copyright: "",
    language: row.language?.trim() || undefined,
    explicit: yes(row.explicit),
  };

  return {
    id: stableId(row),
    metadata,
    assets: {
      audio: { path: row.file_path },
      coverSquare: row.cover_image?.trim()
        ? { path: row.cover_image.trim() }
        : undefined,
      lyrics: row.lyrics_excerpt?.trim()
        ? {
            path: `inline://lyrics/${stableId(row)}`,
            mimeType: "text/plain",
          }
        : undefined,
    },
    technical: {},
    audience: { playsLifetime: 0 },
    ratings: { vectors: {} },
  };
};

export const tracksFromSunoManifest = (
  rows: SunoManifestRow[],
  defaults: SunoDefaults,
): TrackPackage[] =>
  rows
    .filter((row) => row.file_path?.trim())
    .map((row) => trackFromSunoManifest(row, defaults));
