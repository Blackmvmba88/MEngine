# BlackMamba Music Engine — unified stack

MEngine is the canonical product surface. Existing BlackMamba music repositories
are capability sources, not competing applications.

## Canonical flow

```text
FILES / CATALOG / STREAM
        ↓
IDENTITY RESOLVER
        ↓
TRACK PACKAGE
        ↓
MISSING-STATE DETECTOR
        ↓
MENGINE ANALYSIS
        ↓
PLAYER / EDIT / KARAOKE / PRO
        ↓
DISTRIBUTION GATE
        ↓
Distribute
```

## Track Package

One song is not only an audio file. The canonical package contains:

- audio master;
- editable metadata;
- cover 1:1;
- panoramic cover;
- video;
- lyrics when available (optional);
- motto;
- style;
- MEngine technical analysis;
- personal rating;
- audience metrics and derived ratings;
- distribution state.

Lyrics are explicitly optional. Missing lyrics must never block distribution.

## Distribution Gate

The UI always exposes an English button labeled **Distribute**.

The button is disabled until every required gate check passes. Required checks
include audio, core metadata, 1:1 cover, panoramic cover, video, style and motto.
Personal/audience ratings and lyrics are informational and never block the gate.

Green means **eligible to distribute**, not **already distributed**. External
publication remains an explicit action.

## Ratings

Two top-level ratings coexist:

1. **My Rating** — manual 1–5 stars.
2. **Audience Rating** — derived from audience behavior.

Audience Rating is not a single raw-play counter. It is built from normalized
vectors such as explosiveness, popularity, engagement, momentum and longevity.

Additional vectors remain directly inspectable:

- BPM and BPM confidence;
- key/mode;
- energy;
- words per minute;
- tempo stability;
- swing;
- syncopation;
- rhythmic complexity;
- danceability;
- loudness/RMS/dynamic range;
- brightness/spectral centroid;
- bass weight;
- harmonic density;
- pitch range;
- vocal density;
- style strength;
- originality.

The same track can therefore rank differently by age, style, energy,
explosiveness, longevity or audience response.

## Source consolidation

| Source | Bring into MEngine |
| --- | --- |
| MEngine | Canonical UI, MambaSpec, visual analyzers |
| MusicaSoundcloud | Canonical library IDs, verified SoundCloud cotejo, platform metrics |
| suno-suite | Catalog, manifests, streaming, QA, distribution preparation |
| reproductornuevo | Player, playlist, ID3 metadata, subtitles/translation, media tools |
| Rockhero | BPM, beat, key, chord, FFT and energy analysis |
| guitarra | Instrument-specific events and Pro-mode precision |
| voices | Voice acoustic vectors |
| MasterSong | Studio metrics, loudness, stems and technical analysis |
| dj-turntable-system | Deck playback, pitch/tempo, EQ/effects |
| cambiador-de-tonalid | Independent pitch/key/tempo tooling |
| ReproductorAlecksey | Legacy ingest/FFmpeg/visualizer patterns |

The integration rule is **adapt, do not dump**. Python analysis engines can stay
Python services/workers; React/Web Audio capabilities can become native browser
modules. The Track Package is the shared contract.

## Modes

### Player
Playback, queue, catalog browsing, artwork, video, metadata, technical vectors,
ratings and audience counters.

### Edit
Edit metadata and track identity; align sections, lyrics and assets; inspect
missing state.

### Karaoke
Timed lyrics/subtitles and translation. This mode must degrade cleanly for
tracks with no lyrics.

### Pro
The selected instrument determines the precision contract. Voice, guitar,
bass, piano and drums do not share one generic scoring rule.

## Missing-state philosophy

Do not ask the operator to refill the entire song record. Detect only what is
missing or invalid.

```text
track.metadata.release_date_missing
track.asset.video_missing
track.analysis.bpm_missing
track.analysis.key_missing
track.ready_for_distribution
```

That event stream is the bridge to BlackMamba Automator/WARPBLACK.

## First implementation boundary

`src/catalog.ts` is the canonical domain contract and Distribution Gate.
`src/capabilityRegistry.ts` records where existing capabilities currently live.

Next integrations should consume these contracts instead of creating another
parallel player schema.


## Catalog import priority

MEngine accepts both existing catalog families:

1. BlackMamba canonical `library.json` (`{ tracks: [...] }`) — preferred when available because it preserves `localTrackId`.
2. Suno Suite `suno_manifest.json` (array) — imported as a provisional catalog and enriched by the identity resolver.

Verified SoundCloud cotejo is applied by `localTrackId` first, then platform metrics
join by `soundcloudId`. Title matching is only a fallback and ambiguous duplicate
titles are not silently merged.
