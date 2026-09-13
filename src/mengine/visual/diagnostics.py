from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Diagnostic:
    code: str
    severity: str
    message: str
    action: str

    def to_dict(self) -> dict[str, str]:
        return {
            "code": self.code,
            "severity": self.severity,
            "message": self.message,
            "action": self.action,
        }


def diagnose_wave_comparison(comparison: dict[str, Any]) -> list[Diagnostic]:
    deltas = comparison.get("deltas", {})
    similarity = float(comparison.get("similarity", 0.0))
    target = comparison.get("target", {})
    diagnostics: list[Diagnostic] = []

    duration_target = max(float(target.get("duration_seconds", 1.0)), 1e-6)
    duration_delta = float(deltas.get("duration_seconds", 0.0))
    if abs(duration_delta) / duration_target > 0.05:
        diagnostics.append(
            Diagnostic(
                "duration_mismatch",
                "medium",
                f"Duration differs by {duration_delta:+.3f}s.",
                "time_stretch_or_regenerate",
            )
        )

    fundamental_target = max(float(target.get("fundamental_hz", 0.0)), 1.0)
    fundamental_delta = float(deltas.get("fundamental_hz", 0.0))
    if abs(fundamental_delta) / fundamental_target > 0.03:
        diagnostics.append(
            Diagnostic(
                "fundamental_mismatch",
                "high",
                f"Fundamental differs by {fundamental_delta:+.2f} Hz.",
                "pitch_correct_or_regenerate",
            )
        )

    attack_delta = float(deltas.get("attack_time", 0.0))
    if abs(attack_delta) > 0.03:
        diagnostics.append(
            Diagnostic(
                "attack_shape_mismatch",
                "medium",
                f"Attack time differs by {attack_delta:+.3f}s.",
                "adjust_transient_or_regenerate_instrument",
            )
        )

    rms_target = max(float(target.get("rms_energy", 0.0)), 1e-6)
    rms_delta = float(deltas.get("rms_energy", 0.0))
    if rms_delta / rms_target < -0.15:
        diagnostics.append(
            Diagnostic(
                "energy_too_low",
                "medium",
                "Candidate energy is substantially below target.",
                "increase_gain_or_regenerate_with_more_energy",
            )
        )
    elif rms_delta / rms_target > 0.15:
        diagnostics.append(
            Diagnostic(
                "energy_too_high",
                "medium",
                "Candidate energy is substantially above target.",
                "reduce_gain_or_regenerate_with_less_energy",
            )
        )

    centroid_target = max(float(target.get("spectral_centroid", 0.0)), 1.0)
    centroid_delta = float(deltas.get("spectral_centroid", 0.0))
    if centroid_delta / centroid_target > 0.20:
        diagnostics.append(
            Diagnostic(
                "candidate_too_bright",
                "low",
                "Candidate spectral centroid is much higher than target.",
                "rebalance_timbre_or_filter_highs",
            )
        )
    elif centroid_delta / centroid_target < -0.20:
        diagnostics.append(
            Diagnostic(
                "candidate_too_dark",
                "low",
                "Candidate spectral centroid is much lower than target.",
                "rebalance_timbre_or_restore_harmonics",
            )
        )

    if similarity >= 0.95 and not diagnostics:
        diagnostics.append(
            Diagnostic(
                "geometry_match",
                "info",
                "Wave geometry is within the current acceptance envelope.",
                "preserve",
            )
        )

    return diagnostics
