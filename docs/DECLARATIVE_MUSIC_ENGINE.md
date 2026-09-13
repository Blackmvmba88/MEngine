# Declarative Music Engine

MEngine is not defined as a music app or a single generative model. It is a declarative musical rendering engine.

## Contract

The user declares the desired result in MambaSpec.

The engine must then minimize the measurable distance between the rendered audio and that declaration.

```text
MambaSpec
   ↓
Render candidates
   ↓
Mamba Ear
   ↓
Mamba Judge
   ↓
Error map
   ↓
DSP correction or regeneration
   ↓
Certification
```

## Hard constraints

Hard constraints are properties that should be measurable and enforceable within explicit tolerances.

Examples:

- duration
- BPM
- key
- scale/mode
- loudness
- sample format

A hard constraint failure prevents certification unless a deterministic and quality-preserving correction is available.

## Soft constraints

Soft constraints describe musical intent and are scored rather than forced mechanically.

Examples:

- groove
- style
- energy curve
- hook strength
- bass prominence
- vocal density
- originality

Soft failures normally trigger candidate rejection, regeneration, or model rerouting.

## MVP strategy

The first engine does not need a proprietary foundation model.

It can combine:

1. candidate generation from interchangeable backends;
2. automatic measurement;
3. rejection/selection;
4. conservative DSP correction for hard constraints;
5. regeneration for semantic musical constraints.

This allows MEngine to become increasingly obedient before custom model training exists.

## Core principle

> Generation is probabilistic. Certification must not be.

MEngine may use stochastic models internally, but the decision to accept a result must be based on an explicit contract, measured evidence, tolerances, and provenance.
