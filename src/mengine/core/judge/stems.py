from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Mapping

import librosa
import numpy as np

from mengine.core.mambaspec.schema import MambaSpec


@dataclass(frozen=True)
class StemJudgment:
    overall_score: float
    scores: dict[str, float]
    measurements: dict[str, float]
    unresolved: tuple[str, ...] = ()


def _rms(path: str | Path) -> float:
    y, _ = librosa.load(str(path), sr=None, mono=True)
    if y.size == 0:
        return 0.0
    return float(np.sqrt(np.mean(np.square(y.astype(np.float64)))))


def _sub_energy_ratio(path: str | Path, cutoff_hz: float = 120.0) -> float:
    y, sr = librosa.load(str(path), sr=None, mono=True)
    if y.size == 0:
        return 0.0
    spectrum = np.abs(np.fft.rfft(y.astype(np.float64))) ** 2
    frequencies = np.fft.rfftfreq(y.size, d=1.0 / sr)
    total = float(np.sum(spectrum))
    if total <= 1e-12:
        return 0.0
    return float(np.sum(spectrum[frequencies <= cutoff_hz]) / total)


def _unit_score(measured: float, target: float, tolerance: float = 0.35) -> float:
    return float(np.clip(1.0 - abs(measured - target) / tolerance, 0.0, 1.0))


def judge_stems(spec: MambaSpec, stems: Mapping[str, str | Path]) -> StemJudgment:
    """Judge only properties that the current stem evidence can actually measure.

    v0.1 deliberately avoids pretending to measure vocal density, groove or semantic
    quality from four waveform files. Those remain unresolved until dedicated models
    or metrics are attached.
    """
    required = {"bass", "drums", "other", "vocals"}
    missing = required.difference(stems)
    if missing:
        raise ValueError(f"missing required stems: {', '.join(sorted(missing))}")

    energies = {name: _rms(stems[name]) for name in required}
    energy_sum = sum(energies.values())
    bass_prominence = energies["bass"] / energy_sum if energy_sum > 1e-12 else 0.0
    bass_sub_energy = _sub_energy_ratio(stems["bass"])

    scores = {
        "bass_prominence": _unit_score(bass_prominence, spec.bass.prominence),
        "bass_sub_energy": _unit_score(bass_sub_energy, spec.bass.sub_energy),
    }
    measurements = {
        "bass_prominence": bass_prominence,
        "bass_sub_energy": bass_sub_energy,
        **{f"{name}_rms": value for name, value in sorted(energies.items())},
    }
    return StemJudgment(
        overall_score=float(np.mean(list(scores.values()))),
        scores=scores,
        measurements=measurements,
        unresolved=("vocal_density", "groove", "instrument_identity"),
    )
