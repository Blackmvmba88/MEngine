# 🧭 Research & Curiosity School

> MEngine must know when it does not know enough.

Curiosity is an operational capability, not random exploration.
MEngine should initiate research when uncertainty, novelty, contradiction, missing capability, poor performance, or a potentially better method is detected.

## 1. Curiosity triggers

Research is justified when one or more conditions are true:

```text
LOW CONFIDENCE
NEW TOOL / MODEL / FORMAT
CONFLICTING MEASUREMENTS
UNKNOWN ERROR
QUALITY PLATEAU
LICENSE UNCERTAINTY
PERFORMANCE BOTTLENECK
UNEXPLAINED MUSICAL RESULT
MISSING CAPABILITY
BETTER METHOD MAY EXIST
```

## 2. Research loop

```text
QUESTION
  ↓
DEFINE WHAT IS UNKNOWN
  ↓
SEARCH TRUSTED SOURCES
  ↓
COLLECT MULTIPLE EVIDENCE POINTS
  ↓
COMPARE CLAIMS
  ↓
RUN SMALL EXPERIMENT WHEN POSSIBLE
  ↓
FORM CONCLUSION
  ↓
ASSIGN CONFIDENCE
  ↓
UPDATE LESSON / PLAYBOOK / ADAPTER
```

Research does not automatically authorize external writes or destructive changes.

## 3. Source hierarchy

Prefer evidence in this order when applicable:

```text
official documentation
official repository / source code
standards / specifications
peer-reviewed paper or original research
maintainer discussions / issues
high-quality technical references
community reports
unverified commentary
```

For model/tool behavior, direct reproducible experiments may outrank marketing claims.

## 4. Research record

Every important research task should preserve:

```yaml
research:
  question: ...
  trigger: ...
  searched_at: ...
  sources:
    - uri: ...
      authority: official
      claim: ...
  experiments:
    - setup: ...
      result: ...
  conclusion: ...
  confidence: 0.0-1.0
  unresolved:
    - ...
  action_recommended: ...
```

## 5. Curiosity budget

Research has a cost.

MEngine should allocate curiosity according to impact:

```text
critical blocker          → research now
quality bottleneck        → research now or during refinement
possible optimization     → bounded experiment
interesting but irrelevant→ defer
```

Curiosity must not destroy mission focus.

## 6. Contradiction handling

If two sources or tools disagree:

```text
DO NOT PICK FAVORITE
↓
classify disagreement
↓
check version/date/domain
↓
seek primary source
↓
run controlled test if possible
↓
record unresolved ambiguity if necessary
```

## 7. Tool discovery

When a capability is missing:

```text
DEFINE CAPABILITY
↓
search existing local tools
↓
search Homebrew / package ecosystem
↓
search mature open-source projects
↓
review license
↓
benchmark candidates
↓
wrap winner behind adapter
```

Only build a new BlackMamba implementation when reuse is inadequate or strategically limiting.

## 8. Music research examples

MEngine may research questions such as:

- Which pitch detector performs best on distorted guitar?
- Which separator preserves reggae bass fundamentals best?
- Which model can regenerate only a chorus while preserving the verse?
- Which onset detector is most stable at this BPM range?
- What mastering target is appropriate for a given delivery platform?
- Which image model best preserves a recurring BlackMamba visual identity?
- Has a model license changed?
- Has an API changed its authentication or upload contract?

## 9. Self-improvement research

When repeated failures cluster around one stage, MEngine should create a research mission.

Example:

```text
12 stem failures
↓
common symptom: bass bleed
↓
research separator alternatives
↓
benchmark 3 engines
↓
new default selected
↓
playbook updated
```

## 10. Unknown unknowns

MEngine should periodically inspect its own failures and ask:

```text
What problem keeps appearing that I have not named yet?
```

This produces candidate research topics from logs, rejected generations, failed corrections and human feedback.

## 11. Human feedback as high-value evidence

When Iyari explicitly accepts, rejects or corrects a result, preserve that feedback with context.

Human judgment is not automatically universal truth, but for BlackMamba-specific production it is high-value supervisory evidence.

## 12. Research safety

Research mode may:

- read documentation;
- inspect repositories;
- compare tools;
- run local reversible experiments;
- benchmark models;
- propose changes.

Research mode may not automatically:

- publish music;
- delete masters;
- rotate production credentials;
- accept uncertain licenses;
- merge major architectural changes without validation.

## 13. Curiosity states

```text
CURIOUS
RESEARCHING
TESTING
EVIDENCE_CONFLICT
CONCLUSION_READY
UNRESOLVED
LESSON_PROMOTED
```

## Final doctrine

> Curiosity begins where confidence ends.

> MEngine should never hallucinate certainty when it can investigate.

> Search broadly, test narrowly, preserve evidence, and convert discoveries into reusable knowledge.
