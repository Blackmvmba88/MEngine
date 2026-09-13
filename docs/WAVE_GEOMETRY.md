# WaveGeometry — Geometric Audio Representation

BLACKMAMBA MUSIC ENGINE treats audio not only as samples or spectra, but as measurable geometry over time.

## Core idea

A musical event can be represented simultaneously in several domains:

```text
TIME WAVEFORM
+
ENVELOPE
+
FREQUENCY CONTENT
+
TONAL CONTEXT
+
GEOMETRIC DESCRIPTORS
```

For predominantly tonal material, note identity is modeled through:

```text
frequency -> pitch class -> scale degree -> tonal function
```

The waveform itself is then analyzed as a shape.

## Geometric descriptors

For each detected event or note:

- `duration_seconds` — temporal length.
- `peak_amplitude` — highest absolute crest.
- `crest_factor` — peak / RMS.
- `attack_time` — onset to peak.
- `decay_time` — peak to sustain region.
- `attack_slope` — amplitude rise per second.
- `attack_angle_deg` — geometric angle of normalized attack slope.
- `positive_area` — integral above zero.
- `negative_area` — magnitude of integral below zero.
- `absolute_area` — total integrated waveform magnitude.
- `envelope_area` — integral of amplitude envelope.
- `rms_energy` — effective energy proxy.
- `zero_crossings` — sign transitions.
- `spectral_centroid` — brightness center.
- `fundamental_hz` — estimated fundamental frequency.
- `harmonicity` — degree of periodic/harmonic structure.

These measurements let MEngine compare instruments by shape rather than only by labels.

## 3D representation

A practical 3D representation uses:

```text
X = time
Y = amplitude / envelope
Z = frequency or harmonic energy
```

Alternative surface:

```text
X = time
Y = frequency
Z = magnitude
```

This is a geometric spectrogram and can be converted to a mesh for visual inspection.

## Instrument fingerprint

```text
INSTRUMENT EVENT
      ↓
TONAL IDENTITY
      +
WAVE GEOMETRY
      +
SPECTRAL GEOMETRY
      ↓
INSTRUMENT FINGERPRINT
```

## Long-term objective

Use WaveGeometry for instrument fingerprinting, reference-song analysis, generation comparison, stem-by-stem correction, synthesis parameter estimation, 3D visualization, and eventual inverse synthesis from geometric targets.
