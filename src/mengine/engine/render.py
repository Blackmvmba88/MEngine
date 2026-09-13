from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from mengine.backends.base import GeneratorBackend
from mengine.core.ear.extractors import extract_features
from mengine.core.judge.scorers import judge_features
from mengine.core.mambaspec.schema import MambaSpec


@dataclass(frozen=True)
class RenderCandidate:
    path: Path
    score: float
    features: dict[str, Any]
    errors: dict[str, Any]


class MusicRenderEngine:
    """Declarative renderer: spec -> candidates -> measurement -> selection."""

    def __init__(self, backend: GeneratorBackend, candidates_per_round: int = 4, seed: int = 88):
        self.backend = backend
        self.candidates_per_round = candidates_per_round
        self.seed = seed

    def render_round(self, spec: MambaSpec, workdir: str | Path, round_index: int = 0) -> list[RenderCandidate]:
        root = Path(workdir)
        root.mkdir(parents=True, exist_ok=True)
        candidates: list[RenderCandidate] = []

        for index in range(self.candidates_per_round):
            output = root / f"round_{round_index:02d}_candidate_{index:02d}.wav"
            seed = self.seed + round_index * 1000 + index
            self.backend.generate(spec, output, seed=seed)
            features = extract_features(str(output))
            judgment = judge_features(spec, features)
            candidates.append(
                RenderCandidate(
                    path=output,
                    score=judgment.overall_score,
                    features=features.to_dict(),
                    errors=judgment.errors,
                )
            )

        return sorted(candidates, key=lambda candidate: candidate.score, reverse=True)
