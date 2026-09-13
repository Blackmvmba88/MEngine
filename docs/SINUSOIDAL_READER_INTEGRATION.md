# BlackMamba Sinusoidal Reader Integration

MEngine treats the existing BlackMamba sinusoidal projects as observation frontends for the declarative music engine.

They are not decorative visualizers. They are operator instruments.

## Existing BlackMamba projects

Primary readers and related projects:

- `Blackmvmba88/onda-sinusoidal-reactiva`
- `Blackmvmba88/OndaSinusoidalRainbow`
- `Blackmvmba88/OndaNew`
- `Blackmvmba88/ONDASINUS88`
- `Blackmvmba88/ondasinusoidal`
- `Blackmvmba88/Analizador`

MEngine does not copy these repositories into its core. It exposes a stable observation payload that those tools can consume.

## Observation contract

`mengine.visualization.sinusoidal` exports two complementary representations.

### 1. Temporal waveform

```text
X = time
Y = signed amplitude
+ envelope
```

Useful for:

- attack inspection;
- transient comparison;
- clipping detection;
- decay/sustain observation;
- rhythmic shape;
- crest geometry.

### 2. 3D spectral mesh

```text
X = time
Y = frequency
Z = magnitude
```

Useful for:

- harmonic distribution;
- instrument fingerprinting;
- resonances;
- spectral movement;
- stem leakage;
- generated-vs-target comparison.

## Canonical pipeline

```text
MambaSpec
   ↓
Render Engine
   ↓
Candidate WAV
   ↓
Mamba Ear + WaveGeometry
   ↓
Sinusoidal Observation Payload
   ↓
┌─────────────────────────────────────┐
│ onda-sinusoidal-reactiva / readers │
└─────────────────────────────────────┘
   ↓
Human + machine inspection
   ↓
Judge / Corrector
```

## Stems

Every separated stem should be independently observable:

```text
master
├── vocals
├── drums
├── bass
├── instruments
└── other
```

The UI should allow synchronized playback and overlay comparison between:

- target/reference;
- current candidate;
- previous best candidate;
- individual stems.

## Comparison mode

The desired operator view is not only a waveform viewer.

It should expose deltas:

```text
TARGET                CANDIDATE
attack  72°           attack  58°
crest   3.20           crest   2.61
sub     0.88           sub     0.69
width   0.76           width   0.61
```

and visually highlight regions responsible for the error.

## 3D instrument fingerprint

Future views may combine:

```text
X = time
Y = frequency / harmonic index
Z = magnitude
color = phase / confidence / stem identity
```

This makes the sinusoidal ecosystem part of the engine's measurement stack.

## Design principle

> The image does not accompany the music. It exposes the structure that produced the music.

MEngine owns the stable data contract.

BlackMamba readers own presentation, interaction, experimentation, and operator ergonomics.

This separation allows both sides to evolve independently.
