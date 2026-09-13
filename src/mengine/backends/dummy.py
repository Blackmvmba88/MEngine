from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf

from mengine.backends.base import GeneratorBackend
from mengine.core.mambaspec.schema import MambaSpec


class DummyGenerator(GeneratorBackend):
    """Deterministic synthetic backend used to exercise the full pipeline."""

    def generate(self, spec: MambaSpec, output_path: Path, *, seed: int) -> Path:
        sr = 44100
        rng = np.random.default_rng(seed)
        n = int(sr * spec.song.duration)
        t = np.arange(n, dtype=np.float64) / sr
        beat_hz = spec.song.bpm / 60.0
        carrier = 55.0 + 5.0 * np.sin(2 * np.pi * beat_hz * t)
        phase = 2 * np.pi * np.cumsum(carrier) / sr
        bass = 0.15 * np.sin(phase)
        pulse = (np.sin(2 * np.pi * beat_hz * t) > 0.985).astype(float) * 0.18
        noise = rng.normal(0.0, 0.01, n)
        y = np.clip(bass + pulse + noise, -0.95, 0.95).astype(np.float32)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        sf.write(output_path, y, sr, subtype="PCM_24")
        return output_path

    def supports(self, style: str) -> bool:
        return True
