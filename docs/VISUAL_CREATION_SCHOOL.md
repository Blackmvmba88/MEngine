# 🎓 Visual Creation School

> Teach MEngine how a musical work becomes a coherent visual identity.

MEngine does not treat cover art as decoration. Visuals are downstream artifacts derived from musical identity, release context and BlackMamba visual language.

## 1. Visual pipeline

```text
MambaSpec
+ track analysis
+ lyrics/theme
+ release identity
+ artist/label identity
        ↓
VISUAL BRIEF
        ↓
IMAGE MODEL ADAPTER
        ↓
CANDIDATES
        ↓
VISUAL JUDGE
        ↓
REFINE / EDIT
        ↓
FORMAT DERIVATIVES
        ↓
APPROVAL
        ↓
SoundCloud / distributor / social assets
```

The image model is replaceable. The visual brief and approval rules belong to BlackMamba.

## 2. Stable Diffusion / Stability model role

Stable Diffusion-family models may act as one image-generation backend.

MEngine must not encode the assumption that `Stable Diffusion == visual system`.

Instead:

```text
VisualSpec
↓
Adapter
↓
Stable Diffusion / other local model / hosted model / future BlackMamba model
↓
normalized ImageCandidate
```

## 3. License doctrine

Code licenses, model-weight licenses and service/API terms are separate concerns.
Before enabling a model in commercial production, review code license, model license, derivative/finetune terms, hosted-service terms and any revenue threshold. Record exact model, version and license for every production artifact.

## 4. VisualSpec

Every generated image starts from a structured brief rather than an untracked free-form prompt.

```yaml
visualspec: 0.1
identity:
  artist: Iyari Gomez
  label: BlackMamba RECORDS
  release: Dub Protocol
music:
  genre: reggae-dub-tech
  bpm: 92
  key: F# minor
  energy: 0.84
  darkness: 0.72
  psychedelia: 0.64
concept:
  subject: black mamba emerging from a modular dub console
  environment: futuristic sound laboratory
  mood: [nocturnal, powerful, technical, hypnotic]
composition:
  focal_point: centered
  negative_space: title-safe
  depth: cinematic
palette_intent: [black, ultraviolet, electric-green]
branding:
  artist_text: Iyari Gomez
  label_text: BlackMamba RECORDS
  text_rendering: postprocess-preferred
outputs:
  - ratio: "1:1"
    purpose: cover
  - ratio: "16:9"
    purpose: landscape
  - ratio: "9:16"
    purpose: vertical-social
```

## 5. Prompt compiler

```text
VisualSpec
↓
model-specific prompt compiler
↓
positive prompt + negative constraints + seed/config + references
```

This permits switching models without rewriting artistic intent.

## 6. Text handling

Image models are not the authoritative typography engine.

```text
GENERATE ART WITHOUT CRITICAL TEXT
↓
APPROVED IMAGE
↓
DETERMINISTIC TYPOGRAPHY LAYER
↓
Iyari Gomez / BlackMamba RECORDS
```

## 7. Candidate strategy

```text
12 cheap visual sketches
↓
4 composition survivors
↓
2 high-quality renders
↓
1 approved master
↓
derivatives
```

Visual Judge dimensions may include concept match, music match, composition, brand match, originality, artifact score, geometry quality, text-safe area and crop robustness.

## 8. Music-to-image context

Measured musical information may influence visual generation:

- low BPM → heavier spatial pacing;
- high sub energy → denser lower visual mass;
- bright spectrum → stronger fine detail;
- minor tonality → optionally darker tonal direction;
- high psychedelia → more nonlinear geometry/color complexity;
- sharp transients → harder edges and directional forms;
- wide stereo field → wider composition.

These are learnable mappings, not universal artistic laws.

## 9. WaveGeometry as visual source

```text
AUDIO
↓
WaveGeometry
↓
waveform / spectrogram / harmonic contour / 3D surface
↓
conditioning asset
↓
visual generation
```

This allows art to be literally derived from the song.

## 10. Reference-image policy

Every reference image must preserve provenance:

```yaml
reference:
  source: user-owned | generated | licensed | public-domain
  path_or_id: ...
  allowed_use: ...
  hash: ...
```

Unknown-rights references do not enter the release pipeline.

## 11. Image provenance

Store when available:

```text
model
model_version
model_license_reference
seed
sampler_or_scheduler
steps
guidance
prompt_compiler_version
VisualSpec hash
input hashes
output hash
generation timestamp
```

## 12. Visual correction loop

```text
GENERATE
↓
JUDGE
↓
ERROR MAP
↓
EDIT MINIMUM NECESSARY
↓
RENDER
↓
COMPARE
```

Preserve good regions and change only failing dimensions whenever the backend supports targeted editing.

## 13. Release formats

Primary BlackMamba outputs:

```text
1:1   cover master
16:9  landscape/video/header
9:16  vertical social
4:3   optional editorial/legacy
```

Prefer composition-aware crop/extension from one approved visual identity rather than unrelated regeneration for every ratio.

## 14. Visual continuity

For albums or series, preserve a series identity across subject family, palette, material language, typography, camera language and lighting language.

## 15. Failure playbooks

- model unavailable → use another adapter while preserving VisualSpec;
- bad anatomy/geometry → regenerate or region-edit only the failing area;
- unwanted generated text → remove/inpaint, then add deterministic typography;
- wrong composition → preserve concept, modify layout/camera;
- weak music match → recompile from measured musical context;
- unclear license → disable from release path until reviewed.

## 16. Future BlackMamba visual model

The training context is not only images:

```text
MUSIC FEATURES
+
VisualSpec
+
GENERATED CANDIDATES
+
IYARI SELECTION
+
CORRECTIONS
+
FINAL ART
+
PLATFORM PERFORMANCE
```

This allows the system to learn which visual decisions are repeatedly approved for particular musical identities.

## Final lesson

> The cover is another rendering of the song.

> Audio produces musical geometry. VisualSpec translates that identity. Image models are tools; BlackMamba owns the language.
