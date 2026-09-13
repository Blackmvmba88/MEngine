# BLACKMAMBA Music Ecosystem

MEngine is the orchestration and learning layer. It does not try to replace every mature music tool on day one.

The strategy is:

```text
USE THE BEST AVAILABLE TOOL
        ↓
MEASURE IT
        ↓
WRAP IT BEHIND A STABLE CONTRACT
        ↓
LEARN WHAT MATTERS
        ↓
REPLACE ONLY THE STRATEGIC PIECES
```

## First-party BlackMamba systems

### `Blackmvmba88/Music`
Role: canonical career/music operating system.

MEngine consumes its catalog, ratings, metadata, lyrics, editorial evidence, Suno/SoundCloud availability and local WAV references through an adapter. `Music` remains authoritative for library state.

### `Blackmvmba88/MusicaSoundcloud`
Role: production and delivery pipeline.

Provides WAV-master discipline, package validation, Suno-to-master lifecycle, SoundCloud private delivery and reconciliation concepts. MEngine should produce analysis/certification artifacts that this pipeline can consume rather than bypassing its safety rules.

### `Blackmvmba88/Musica`
Role: release/catalog intelligence.

Provides catalog reconciliation, metadata audits, release watchdog concepts and platform presence. This is one source for later audience/result learning.

### `Blackmvmba88/onda-sinusoidal-reactiva`
Role: visual DSP laboratory.

Provides waveform/FFT/realtime visualization concepts and becomes the natural UI host for WaveGeometry: time, amplitude, frequency, envelope, attack and harmonic surfaces.

### `Blackmvmba88/Analizador`
Role: semantic music-analysis vocabulary.

Provides the conceptual schema for form, harmony, melody, rhythm, texture, arrangement and mastering. MEngine turns those concepts into measured/estimated values where possible.

### `Blackmvmba88/afindor`
Role: pitch-engine laboratory.

Provides real-time pitch, cents and swappable pitch-engine concepts. MEngine should share pitch contracts instead of duplicating incompatible note representations.

### `Blackmvmba88/ai-dj`
Role: realtime generation/VST reference system.

Useful as architectural evidence for local inference, DAW/VST integration, tempo synchronization and interactive generation. Treat it as a reference/adaptable component, not as MEngine's core identity.

## Selected upstream systems

### ACE-Step 1.5
Primary candidate for complete-song generation and controlled experiments.

Useful capabilities include song generation, metadata control, reference audio, editing, stems and LoRA workflows. It stays behind an adapter so MambaSpec is independent of ACE-Step.

### Stable Audio Tools
Research and generation backend for conditional audio, model training and diffusion/autoencoder experiments.

### Spotify Basic Pitch
Pitch/note/MIDI transcription candidate. Particularly useful for converting waveform material into symbolic note events that can be compared with MambaSpec tonal targets.

### librosa
Default Python MIR/DSP toolbox for the early Mamba Ear. Good for iteration speed and broad feature extraction.

### Demucs
Source-separation baseline and benchmark. Upstream is archived, so it must never be the only separator contract. Preserve the adapter and compare future engines against it.

### Essentia
Powerful optional MIR backend, but its AGPL/commercial licensing means it is disabled by default in the commercial-safe core. Use only behind an explicit external-tool boundary after license review.

## Homebrew / native acceleration layer

MEngine should prefer mature native tools when present and fall back cleanly:

```text
ffmpeg / ffprobe  -> decode, transcode, probe, segmentation
sox               -> fast DSP transforms and inspection
aubio              -> onset / beat / pitch utilities
rubberband         -> high-quality time stretch / pitch shift
libsndfile         -> audio I/O substrate
python/librosa     -> portable fallback + research layer
```

The rule is not "Homebrew owns the architecture". The rule is:

> Native tools accelerate the current implementation; BlackMamba contracts own the architecture.

## Capability routing

MEngine should eventually resolve work like this:

```text
REQUEST: separate stems
    ↓
CAPABILITY REGISTRY
    ↓
benchmark score + availability + license + cost + hardware
    ↓
selected adapter
    ↓
normalized MEngine result
```

Likewise:

```text
REQUEST: detect notes
    ↓
Basic Pitch / tuner engine / future BlackMamba engine
    ↓
normalized NoteEvent[]
```

and:

```text
REQUEST: generate complete song
    ↓
ACE-Step / future engines
    ↓
MambaSpec adapter
    ↓
audio candidate
    ↓
Mamba Ear + WaveGeometry + Judge
```

## Stable BlackMamba contracts

External engines are disposable. These contracts are not:

- `MambaSpec` — musical intention and constraints.
- `NoteEvent` — symbolic pitch/time representation.
- `StemSet` — normalized separated sources.
- `WaveGeometry` — geometric/acoustic descriptors.
- `FeatureMap` — measured song/stem features.
- `Candidate` — generated or transformed audio plus provenance.
- `Judgement` — scores, evidence, errors and confidence.
- `CorrectionPlan` — explicit next actions.
- `Certification` — release-readiness result.

## Replacement doctrine

We only replace an upstream component when at least one condition is true:

1. it is a measurable quality bottleneck;
2. its license blocks the intended product;
3. its cost blocks the intended product;
4. it cannot expose a capability required by MambaSpec;
5. its latency prevents the target workflow;
6. BlackMamba has accumulated enough data to build a demonstrably better specialized component.

Until then, integration beats reinvention.

## Long-term direction

```text
TODAY
mature external engines
+ BlackMamba repos
+ MEngine contracts

        ↓ measurement + lessons

TOMORROW
BlackMamba-specific models
+ custom DSP
+ learned routing
+ closed-loop generation

        ↓

END STATE
BLACKMAMBA MUSIC ENGINE
owns the specification,
learning loop,
quality standard,
and strategic generation stack.
```
