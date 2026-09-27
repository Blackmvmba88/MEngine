import type {
  TrackMetadata,
  TrackPackage,
} from "../catalog";

export type CanonicalLibraryTrack = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  style?: string;
  motto?: string;
  label?: string;
  composer?: string;
  producer?: string;
  releaseDate?: string;
  copyright?: string;
  language?: string;
  explicit?: boolean;
  audio?: string;
  file?: string;
  audioPath?: string;
  cover?: string;
  coverSquare?: string;
  artwork?: string;
  panoramic?: string;
  coverPanoramic?: string;
  wideCover?: string;
  video?: string;
  lyrics?: string;
  soundcloudId?: string;
  soundcloudUrl?: string;
};

export type CanonicalLibrary = {
  tracks: CanonicalLibraryTrack[];
};

export type LibraryDefaults = {
  artist: string;
  label: string;
  composer: string;
  producer: string;
};

const pick = (...values: Array<string | undefined>): string | undefined =>
  values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();

export const trackFromCanonicalLibrary = (
  row: CanonicalLibraryTrack,
  defaults: LibraryDefaults,
): TrackPackage => {
  const metadata: TrackMetadata = {
    title: row.title,
    artist: pick(row.artist, defaults.artist) ?? defaults.artist,
    releaseType: row.album ? "album" : "single",
    album: row.album,
    genre: row.genre ?? "",
    style: row.style ?? "",
    motto: row.motto ?? "",
    label: pick(row.label, defaults.label) ?? defaults.label,
    composer: pick(row.composer, defaults.composer) ?? defaults.composer,
    producer: pick(row.producer, defaults.producer) ?? defaults.producer,
    releaseDate: row.releaseDate ?? "",
    copyright: row.copyright ?? "",
    language: row.language,
    explicit: row.explicit,
  };

  return {
    id: row.id,
    sources: {
      localTrackId: row.id,
      soundcloudId: row.soundcloudId,
      soundcloudUrl: row.soundcloudUrl,
    },
    metadata,
    assets: {
      audio: pick(row.audio, row.file, row.audioPath)
        ? { path: pick(row.audio, row.file, row.audioPath)! }
        : undefined,
      coverSquare: pick(row.coverSquare, row.cover, row.artwork)
        ? { path: pick(row.coverSquare, row.cover, row.artwork)! }
        : undefined,
      coverPanoramic: pick(row.coverPanoramic, row.panoramic, row.wideCover)
        ? { path: pick(row.coverPanoramic, row.panoramic, row.wideCover)! }
        : undefined,
      video: row.video ? { path: row.video } : undefined,
      lyrics: row.lyrics ? { path: row.lyrics } : undefined,
    },
    technical: {},
    audience: { playsLifetime: 0 },
    ratings: { vectors: {} },
  };
};

export const tracksFromCanonicalLibrary = (
  library: CanonicalLibrary,
  defaults: LibraryDefaults,
): TrackPackage[] =>
  (library.tracks ?? [])
    .filter((track) => track.id && track.title)
    .map((track) => trackFromCanonicalLibrary(track, defaults));
