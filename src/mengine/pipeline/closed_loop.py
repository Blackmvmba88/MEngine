from __future__ import annotations

from pathlib import Path
from typing import Any

from mengine.backends.base import GeneratorBackend
from mengine.core.ear.extractors import extract_features
from mengine.core.judge.scorers import judge_features
from mengine.core.mambaspec.schema import MambaSpec


class ClosedLoopComposer:
    def __init__(self, generator: GeneratorBackend, max_iterations: int = 3, seed: int = 88):
        self.generator = generator
        self.max_iterations = max_iterations
        self.seed = seed
        self.history: list[dict[str, Any]] = []

    def compose(self, spec: MambaSpec, workdir: str | Path) -> dict[str, Any]:
        root = Path(workdir)
        root.mkdir(parents=True, exist_ok=True)
        best: dict[str, Any] | None = None

        for iteration in range(1, self.max_iterations + 1):
            output = root / f"iteration_{iteration:02d}.wav"
            self.generator.generate(spec, output, seed=self.seed + iteration - 1)
            features = extract_features(str(output))
            judgment = judge_features(spec, features)

            record = {
                "iteration": iteration,
                "path": str(output),
                "features": features.to_dict(),
                "judgment": {
                    "overall_score": judgment.overall_score,
                    "scores": judgment.scores,
                    "errors": judgment.errors,
                },
            }
            self.history.append(record)
            if best is None or judgment.overall_score > best["judgment"]["overall_score"]:
                best = record

            if judgment.overall_score >= spec.target.minimum_quality:
                return self._certify(record)

        return {
            "status": "rejected",
            "reason": "max_iterations_exceeded",
            "best_iteration": best,
            "history": self.history,
        }

    def _certify(self, record: dict[str, Any]) -> dict[str, Any]:
        return {
            "status": "certified",
            "path": record["path"],
            "score": record["judgment"]["overall_score"],
            "iteration": record["iteration"],
            "history": self.history,
        }
