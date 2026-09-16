# 🐍 BLACKMAMBA MUSIC ENGINE

> **Generate → Listen → Analyze → Compare → Correct → Regenerate → Certify**

BLACKMAMBA MUSIC ENGINE is an experimental autonomous music-production platform focused on full-song generation, musical analysis, stem separation, iterative evaluation, and multi-model orchestration.

The goal is not merely to generate audio. The goal is to build a **music producer that can listen to its own output, detect deviations from a target specification, correct them, and iterate until the result is certified**.

## Control surface v0.1

The repository now includes the first official BlackMamba Music Engine visual control surface.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

Current UI capabilities:

- Theme presets: **BlackMamba, Silver, Violet, Ocean, Princess**.
- Every visual color is editable live from the control panel.
- Panel names are editable live.
- Waveform, FFT, Spectrogram, Pitch, Harmonics and Stereo Phase can each become the main view.
- Configuration persists locally in the browser.
- UI actions are surfaced in an activity stream instead of happening invisibly.
- `npm run build` is the minimum certification gate for the control surface.

The preview visualizations are currently a UI/runtime harness. Real audio data will be connected through the Mamba Ear / audio input layer rather than hard-coupling the theme system to one analyzer implementation.

## Core hypothesis

```text
GOOD MODEL
+
GOOD FEEDBACK LOOP
+
GOOD MUSICAL SPECIFICATION
+
GOOD DATA
>
BIG MODEL ALONE
```

## Closed-loop architecture

```text
INTENT / REFERENCE
        ↓
     MAMBA SPEC
        ↓
      GENERATE
        ↓
       LISTEN
        ↓
       ANALYZE
        ↓
       COMPARE
        ↓
      ERROR MAP
      ↙       ↘
   CORRECT    PASS
      ↓         ↓
 REGENERATE   MASTER
                ↓
             CERTIFY
                ↓
              EXPORT
```

Generation is not completion. **Completion requires evaluation.**

## Major components

- **MambaSpec** — model-agnostic representation of musical intent.
- **Mamba Ear** — audio analysis into measurable musical features.
- **Stem Intelligence** — vocals/drums/bass/music separation and per-layer analysis.
- **Model Orchestrator** — interchangeable generation backends.
- **Mamba Judge** — scores composition, arrangement, rhythm, vocals, bass, mix, hook, structure, originality, and target alignment.
- **Mamba Corrector** — converts measured deviations into actionable regeneration parameters.
- **Closed-Loop Composer** — Generate → Listen → Judge → Correct → Regenerate → Certify.
- **BlackMamba Dataset** — reproducible observations from BlackMamba Records material and controlled experiments.

## MambaSpec example

```yaml
mambaspec: 0.1

identity:
  label: BlackMamba Records
  artist: Iyari Gomez

song:
  duration: 218
  bpm: 92
  meter: 4/4

style:
  primary: reggae-dub
  secondary:
    - psychedelic
    - electronic
    - tech

rhythm:
  swing: 0.12
  syncopation: 0.81
  kick_density: 0.34

bass:
  prominence: 0.92
  sub_energy: 0.88

vocals:
  language: en
  density: 0.31
  repetition: 0.82

target:
  originality: 0.95
  minimum_quality: 0.92
```

## Stem benchmark strategy

Commercial tools such as VirtualDJ may be used as **black-box quality references**: input and observable outputs can be measured and compared against open separation engines without relying on proprietary implementation details.

Candidate open systems include Demucs, MDX-family models, and RoFormer-family separation models. Metrics may include bleed, transient preservation, spectral loss, phase coherence, vocal artifacts, and bass reconstruction.

## Initial roadmap

1. **MambaSpec v0.1** — stable schema and validation.
2. **Mamba Ear v0.1** — BPM, key, loudness, spectral and structural feature extraction.
3. **Stem Benchmark v0.1** — reproducible comparison harness.
4. **First model adapter** — connect one generative backend.
5. **Mamba Judge v0.1** — measurable scoring.
6. **Closed Loop v0.1** — first autonomous correction/regeneration cycle.
7. **BlackMamba Dataset** — structured catalog analysis.
8. **ZERO-TO-SONG** — compose, arrange, perform, mix, master and certify from specification alone.

## Engineering principles

```text
MODEL-AGNOSTIC
LOCAL-FIRST WHEN POSSIBLE
REPRODUCIBLE
MEASURABLE
MODULAR
AUDITABLE
CREATOR-CENTRIC
ITERATIVE
```

## Research boundary

The project may study commercial systems through documented functionality, observable behavior, and controlled black-box experiments. It does not require proprietary source code, stolen model weights, bypassing access controls, or extracting confidential implementation details.

---

## BlackMamba Records

**Iyari Gomez**

> Music is not generated. Music is engineered, heard, corrected, and finally certified.
