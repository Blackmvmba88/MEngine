from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ConstraintKind(str, Enum):
    HARD = "hard"
    SOFT = "soft"


@dataclass(frozen=True)
class Constraint:
    name: str
    kind: ConstraintKind
    tolerance: float | None = None
    weight: float = 1.0


DEFAULT_CONSTRAINTS: tuple[Constraint, ...] = (
    Constraint("duration", ConstraintKind.HARD, tolerance=0.5, weight=1.0),
    Constraint("bpm", ConstraintKind.HARD, tolerance=2.0, weight=1.0),
    Constraint("key", ConstraintKind.HARD, tolerance=None, weight=1.0),
    Constraint("scale", ConstraintKind.HARD, tolerance=None, weight=1.0),
    Constraint("loudness", ConstraintKind.HARD, tolerance=1.0, weight=0.8),
    Constraint("style", ConstraintKind.SOFT, tolerance=None, weight=0.8),
    Constraint("groove", ConstraintKind.SOFT, tolerance=None, weight=0.9),
    Constraint("energy_curve", ConstraintKind.SOFT, tolerance=None, weight=0.9),
    Constraint("originality", ConstraintKind.SOFT, tolerance=None, weight=1.0),
)
