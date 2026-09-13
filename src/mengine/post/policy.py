from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class CorrectionMode(str, Enum):
    DSP = "dsp"
    REGENERATE = "regenerate"
    REVIEW = "review"


@dataclass(frozen=True)
class CorrectionDecision:
    parameter: str
    mode: CorrectionMode
    reason: str


def choose_correction(parameter: str, delta: float | None = None) -> CorrectionDecision:
    if parameter == "duration":
        return CorrectionDecision(parameter, CorrectionMode.DSP, "trim/pad is deterministic")
    if parameter == "loudness":
        return CorrectionDecision(parameter, CorrectionMode.DSP, "gain normalization is deterministic")
    if parameter == "bpm":
        if delta is not None and abs(delta) <= 0.08:
            return CorrectionDecision(parameter, CorrectionMode.DSP, "small time-stretch is acceptable")
        return CorrectionDecision(parameter, CorrectionMode.REGENERATE, "large tempo shifts risk musical damage")
    if parameter in {"key", "scale"}:
        return CorrectionDecision(parameter, CorrectionMode.REGENERATE, "tonal identity should be regenerated before pitch-shift fallback")
    if parameter in {"style", "groove", "energy_curve", "originality"}:
        return CorrectionDecision(parameter, CorrectionMode.REGENERATE, "semantic musical property")
    return CorrectionDecision(parameter, CorrectionMode.REVIEW, "no safe automatic correction policy")
