# Identity resolver + missing-state layer

This is the layer between a folder/catalog and MEngine.

## Goal

Do not ask the operator to review every field on every song.

```text
FILES
  ↓
name / dimensions / extension / metadata
  ↓
IDENTITY RESOLVER
  ↓
one Track Package
  ↓
MISSING-STATE DETECTOR
  ↓
only actionable gaps
```

## Identity confidence

- **exact** — normalized base name matches the audio anchor.
- **probable** — token overlap is strong enough to associate automatically.
- **review** — the engine will not silently attach the asset.

Examples that collapse to one identity:

```text
Frequency.wav
Frequency-cover-1x1.png
Frequency-wide.png
Frequency-video.mp4
Frequency-lyrics.lrc
```

Image dimensions win over naming when dimensions are available:
square => cover 1:1, landscape => panoramic.

## Missing state

Required distribution gaps emit blocker events such as:

```text
track.metadata.releaseDate_missing
track.asset.coverPanoramic_missing
track.asset.video_missing
```

Recommended analysis gaps are warnings:

```text
track.analysis.bpm_missing
track.analysis.key_missing
track.analysis.energy_missing
track.analysis.wpm_missing
```

Lyrics can emit an informational event only when optional-state reporting is
requested. They never become a blocker.

When zero required gaps remain:

```text
track.ready_for_distribution
```

That event can be consumed by BlackMamba Automator, while the actual external
distribution action remains explicit.
