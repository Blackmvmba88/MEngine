# 🐍 MAMBA FIELD MANUAL

> Fast operational doctrine for BLACKMAMBA MUSIC ENGINE.

MEngine must not improvise its operating rules from scratch on every run.
This manual defines the default response to common situations so the system can act quickly, consistently, and audibly.

## Prime directive

```text
OBSERVE
  ↓
MEASURE
  ↓
CLASSIFY SITUATION
  ↓
LOAD PLAYBOOK
  ↓
ACT WITHIN BOUNDS
  ↓
VERIFY RESULT
  ↓
RECORD LESSON
```

Never skip verification.

---

# 1. General operating rules

1. Preserve the original audio.
2. Never overwrite canonical material without a verified replacement.
3. Prefer measured evidence over assumptions.
4. If confidence is low, reduce scope instead of guessing.
5. If a tool fails, switch adapters before redesigning the system.
6. If a model improves the result, preserve the good sections before further correction.
7. Every transformation must retain provenance.
8. Every external dependency must have a known license and integration mode.
9. Every expensive operation must have a cheaper preflight when possible.
10. Every failed attempt is training context if it is recorded correctly.

---

# 2. Situation matrix

| Situation | Immediate action | Never do |
| --- | --- | --- |
| Input audio missing | stop task, preserve metadata, mark unresolved | fabricate analysis |
| Audio unreadable | probe with ffprobe/sox, attempt safe decode copy | overwrite original |
| BPM uncertain | run multiple estimators and compare | force nearest integer silently |
| Key/scale uncertain | aggregate pitch-class evidence, report confidence | declare certainty from one frame |
| Pitch engine disagreement | keep both measurements, run tie-breaker | discard dissenting engine silently |
| Stem separation poor | try alternate separator, compare bleed/artifacts | treat bad stems as ground truth |
| Generation misses target | compute error map, repair smallest failing region | regenerate everything first |
| Good section detected | lock/preserve region or stem | destroy it during unrelated repair |
| Model unavailable | route to compatible adapter | block entire pipeline if fallback exists |
| Native CLI unavailable | fall back to Python implementation | hard fail for optional accelerator |
| GPU unavailable | switch to CPU/light model or queue expensive stage | pretend GPU inference occurred |
| Compute budget exceeded | stop low-value candidates, keep best checkpoint | continue blindly |
| License uncertain | disable integration for distributable build | ship first, review later |
| Catalog identity ambiguous | mark needs-review and preserve evidence | match by title alone |
| Duplicate suspected | compare stable IDs, hashes, duration and evidence | delete automatically |
| External API changed | fail closed on writes, allow safe reads if valid | guess new write semantics |
| CI fails | isolate first failing deterministic check | merge because local run passed |
| Metric regression | compare against previous certified fixture | move threshold to hide failure |
| Unknown situation | enter safe exploratory mode and log evidence | invent a permanent rule immediately |

---

# 3. Audio ingestion playbook

```text
FILE
 ↓
HASH ORIGINAL
 ↓
ffprobe
 ↓
validate duration / channels / sample rate / codec
 ↓
create working copy if normalization is required
 ↓
Mamba Ear
 ↓
WaveGeometry
```

Store:

- original SHA-256;
- working-copy SHA-256;
- codec;
- sample rate;
- channels;
- duration;
- provenance;
- timestamp;
- tool versions.

The original remains immutable.

---

# 4. Tonality playbook

For predominantly tonal music:

```text
pitch evidence
 + chroma
 + stable fundamentals
 + note events
 + harmonic context
        ↓
key candidates
        ↓
scale candidates
        ↓
confidence ranking
```

If the first and second candidate are too close, classify as uncertain.

Output example:

```yaml
key:
  primary: F# minor
  confidence: 0.86
  alternatives:
    - key: A major
      confidence: 0.77
```

Never hide harmonic ambiguity.

---

# 5. Instrument fingerprint playbook

For every reliable stem or isolated event:

```text
pitch / note role
+
attack geometry
+
crest factor
+
envelope area
+
harmonic distribution
+
decay
+
stereo behavior
+
spectral profile
        ↓
InstrumentFingerprint
```

If separation quality is low, lower fingerprint confidence.

---

# 6. Generation playbook

```text
MambaSpec
 ↓
select backend
 ↓
cheap candidate generation
 ↓
Mamba Ear
 ↓
Judge
 ↓
rank
 ↓
refine only survivors
```

Do not spend premium compute on weak candidates.

Recommended funnel:

```text
100 sketches
 ↓
25 viable
 ↓
8 strong
 ↓
3 finalists
 ↓
1 certified candidate
```

The exact numbers are configurable.

---

# 7. Correction playbook

When a candidate fails:

1. Identify the smallest failing dimensions.
2. Preserve passing dimensions.
3. Lock strong stems/sections where the backend allows it.
4. Produce a CorrectionPlan.
5. Change the fewest parameters necessary.
6. Regenerate or repair.
7. Re-measure.
8. Accept only demonstrated improvement.

Example:

```yaml
failure:
  bass_energy: -0.18
  chorus_width: -0.11
  vocal_density: +0.14

preserve:
  - melody
  - drums
  - verse_2

repair:
  - increase_sub_energy
  - widen_chorus
  - reduce_vocal_density
```

---

# 8. Regression playbook

If a new attempt scores worse:

```text
new_score < previous_score
        ↓
restore best checkpoint
        ↓
identify changed dimensions
        ↓
mark failed correction
        ↓
choose alternate correction
```

Never confuse novelty with improvement.

---

# 9. Model disagreement playbook

When two analyzers disagree:

```text
ENGINE A
ENGINE B
   ↓
compare confidence + evidence + operating domain
   ↓
third measurement if material
   ↓
consensus OR explicit uncertainty
```

Disagreement is data.

---

# 10. Stem failure playbook

Symptoms:

- vocal leakage in drums;
- bass missing fundamentals;
- phase artifacts;
- cymbal smearing;
- transient loss.

Response:

```text
separator A
 ↓ poor
separator B
 ↓
score separation quality
 ↓
keep best result
```

Do not use a single separator as universal truth.

---

# 11. Tool failure playbook

For optional native accelerators:

```text
preferred native tool
 ↓ unavailable/fails
Python fallback
 ↓ fails
alternate adapter
 ↓ fails
safe stop + diagnostic
```

Required result fields:

```yaml
status: degraded
requested_capability: time_stretch
attempted:
  - rubberband
  - python_fallback
reason: ...
```

---

# 12. License safety playbook

Before enabling a new dependency in a distributable/commercial path:

```text
identify repository
 ↓
identify code license
 ↓
identify model/weights license separately
 ↓
identify dataset restrictions if relevant
 ↓
classify integration boundary
 ↓
approve / isolate / disable
```

Never infer model-weight rights from code license alone.

---

# 13. Catalog conflict playbook

Track identity priority:

```text
stable platform ID
> verified content hash
> ISRC / UPC / release identity
> duration + metadata evidence
> title similarity
```

Title alone is never enough for destructive actions.

---

# 14. External-write playbook

Any action that publishes, uploads, deletes, replaces, or modifies remote state:

```text
READ
 ↓
PLAN
 ↓
VALIDATE
 ↓
WRITE
 ↓
READ BACK
 ↓
COMPARE
 ↓
CERTIFY
```

If read-back differs from intent, stop further writes.

---

# 15. Unknown-situation protocol

When no playbook matches:

```text
SAFE MODE
```

Rules:

1. Make no destructive changes.
2. Collect evidence.
3. Identify nearest existing playbook.
4. Perform smallest reversible experiment.
5. Record outcome.
6. Create a candidate new lesson/playbook.
7. Promote it only after repeated success.

This prevents one strange event from becoming bad permanent doctrine.

---

# 16. Lesson promotion

A successful correction becomes reusable knowledge only when it contains:

```text
CONTEXT
PROBLEM
MEASUREMENT
ACTION
RESULT
CONFIDENCE
APPLICABILITY
```

Example:

```yaml
lesson:
  context:
    genre: reggae-dub
    stem: bass
  problem:
    sub_energy_below_target: 0.16
  action:
    increase_sub_energy: 0.12
    preserve_fundamental: true
  result:
    score_before: 0.74
    score_after: 0.91
  confidence: 0.89
  reusable: true
```

---

# 17. Mamba operational state

Every mission should expose one state:

```text
READY
ANALYZING
GENERATING
COMPARING
CORRECTING
DEGRADED
BLOCKED
CERTIFIED
NEEDS_REVIEW
```

No ambiguous hidden state.

---

# Final doctrine

> MEngine should be fast because it remembers what to do, not because it skips thinking.

> Measure first. Preserve what works. Change the minimum. Verify everything. Learn from every attempt.
