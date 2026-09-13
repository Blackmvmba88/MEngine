# First Real Render — ACE-Step → MEngine

This is the first path that replaces the deterministic DummyGenerator with a real music model while keeping MEngine in control of specification, measurement and certification.

## Architecture

```text
MambaSpec
   ↓
AceStepAPIBackend
   ↓
ACE-Step local REST API
   ↓
WAV candidate
   ↓
Mamba Ear
   ↓
Mamba Judge
   ↓
certify / reject / refine
```

ACE-Step is an interchangeable renderer. MEngine does not vendor its code or model weights.

## 1. Prepare MEngine on macOS

```bash
git clone https://github.com/Blackmvmba88/MEngine.git
cd MEngine
git switch tokyo/mamba-engine-v0
brew bundle
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
python -m pip install -e '.[dev]'
make check
```

Optional Demucs support:

```bash
python -m pip install -e '.[stems]'
```

## 2. Start ACE-Step separately

Install/launch ACE-Step 1.5 according to its upstream documentation. Its documented API launcher is:

```bash
uv run acestep-api
```

The documented default API address is normally:

```text
http://127.0.0.1:8001
```

Verify it independently:

```bash
curl http://127.0.0.1:8001/health
```

If the endpoint differs:

```bash
export MENGINE_ACESTEP_URL='http://127.0.0.1:8001'
```

If API authentication is enabled:

```bash
export MENGINE_ACESTEP_API_KEY='...'
```

MEngine never stores that token in the repository.

## 3. Generate the first candidate

```bash
python examples/ace_step_render.py --duration 30 --seed 88
```

Expected output location:

```text
.mengine/ace-step/first-render.wav
```

The example immediately re-opens the generated WAV and measures:

- BPM;
- key and mode;
- key confidence;
- integrated LUFS;
- spectral centroid;
- zero-crossing rate;
- current Mamba Judge score.

The generated model metadata is not accepted as truth. MEngine measures the rendered waveform itself.

## 4. Separate stems

With optional stem dependencies installed:

```python
from mengine.stems import DemucsSeparator, analyze_stems

separator = DemucsSeparator()
stems = separator.separate(
    '.mengine/ace-step/first-render.wav',
    '.mengine/stems',
)
analysis = analyze_stems(stems)
```

Demucs is currently a baseline, not a permanent dependency. MEngine's adapter boundary allows a better separator to replace it later.

## 5. Stem-aware judgment

```python
from mengine.core.judge.stems import judge_stems

result = judge_stems(spec, stems)
print(result.measurements)
print(result.scores)
print(result.unresolved)
```

Current measurable layer constraints include:

- relative bass prominence;
- bass sub-energy ratio.

Semantic properties that are not yet measured reliably remain explicitly unresolved rather than being fabricated.

## First-render acceptance rule

The first successful model render is not automatically a certified song.

A milestone is reached when all of these are true:

1. ACE-Step returns a non-empty WAV from a MambaSpec-controlled request.
2. Mamba Ear can reopen and measure the file.
3. Mamba Judge produces a deterministic evidence record.
4. Optional stems can be separated without modifying the original.
5. The result is preserved even if it fails certification.

Only after this pipeline works repeatably should automatic correction/regeneration be promoted to the next milestone.
