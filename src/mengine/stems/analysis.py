from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

from mengine.core.ear.extractors import AudioFeatures, extract_features


@dataclass(frozen=True)
class StemAnalysis:
    stem: str
    path: Path
    features: AudioFeatures

    def to_dict(self) -> dict[str, Any]:
        return {
            "stem": self.stem,
            "path": str(self.path),
            "features": self.features.to_dict(),
        }


def analyze_stems(stems: Mapping[str, str | Path]) -> dict[str, StemAnalysis]:
    """Analyze every separated layer using the same measurable Mamba Ear contract."""
    out: dict[str, StemAnalysis] = {}
    for stem, raw_path in stems.items():
        path = Path(raw_path)
        if not path.exists():
            raise FileNotFoundError(path)
        out[stem] = StemAnalysis(stem=stem, path=path, features=extract_features(str(path)))
    return out
