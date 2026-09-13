from __future__ import annotations

from dataclasses import dataclass, field

from mengine.core.ear.extractors import AudioFeatures
from mengine.core.mambaspec.schema import MambaSpec


@dataclass(frozen=True)
class JudgmentResult:
    overall_score: float
    scores: dict[str, float] = field(default_factory=dict)
    errors: dict[str, float | str] = field(default_factory=dict)


def _ratio_score(measured: float, target: float, tolerance: float) -> float:
    if tolerance <= 0:
        raise ValueError("tolerance must be positive")
    return max(0.0, 1.0 - abs(measured - target) / tolerance)


def judge_features(spec: MambaSpec, features: AudioFeatures) -> JudgmentResult:
    bpm_score = _ratio_score(features.bpm, spec.song.bpm, tolerance=max(4.0, spec.song.bpm * 0.08))

    tonal_score = 0.5
    if spec.song.key:
        tonal_score = 1.0 if features.key == spec.song.key else 0.0
    if spec.song.scale:
        tonal_score = 0.5 * tonal_score + 0.5 * (1.0 if features.mode == spec.song.scale else 0.0)

    technical_score = 1.0 if -30.0 <= features.loudness_lufs <= -6.0 else 0.65
    confidence_score = features.key_confidence

    scores = {
        "tempo": bpm_score,
        "tonality": tonal_score,
        "technical": technical_score,
        "analysis_confidence": confidence_score,
    }
    overall = sum(scores.values()) / len(scores)
    errors = {
        "bpm_delta": features.bpm - spec.song.bpm,
        "detected_key": features.key,
        "detected_mode": features.mode,
    }
    return JudgmentResult(overall_score=overall, scores=scores, errors=errors)
