from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from mengine.core.mambaspec.schema import MambaSpec


class GeneratorBackend(ABC):
    @abstractmethod
    def generate(self, spec: MambaSpec, output_path: Path, *, seed: int) -> Path:
        """Generate audio matching a MambaSpec and return the rendered path."""

    @abstractmethod
    def supports(self, style: str) -> bool:
        """Return whether this backend can attempt the requested primary style."""
