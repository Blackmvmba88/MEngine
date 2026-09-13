from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


class DemucsError(RuntimeError):
    """Raised when Demucs separation cannot complete safely."""


class DemucsSeparator:
    """Thin, replaceable adapter around Demucs source separation.

    Demucs is treated as an external capability rather than vendored into MEngine.
    Output is always written beneath a caller-provided work directory.
    """

    STEMS = ("drums", "bass", "other", "vocals")

    def __init__(self, model: str = "htdemucs", *, device: str | None = None) -> None:
        self.model = model
        self.device = device

    @staticmethod
    def available() -> bool:
        # Console entry point is common, but `python -m demucs` is the portable path.
        if shutil.which("demucs"):
            return True
        try:
            completed = subprocess.run(
                [sys.executable, "-c", "import demucs"],
                check=False,
                capture_output=True,
                timeout=10,
            )
        except OSError:
            return False
        return completed.returncode == 0

    def command(self, audio_path: str | Path, output_root: str | Path) -> list[str]:
        cmd = [
            sys.executable,
            "-m",
            "demucs",
            "-n",
            self.model,
            "--float32",
            "-o",
            str(Path(output_root)),
        ]
        if self.device:
            cmd.extend(["-d", self.device])
        cmd.append(str(Path(audio_path)))
        return cmd

    def expected_stem_dir(self, audio_path: str | Path, output_root: str | Path) -> Path:
        return Path(output_root) / self.model / Path(audio_path).stem

    def discover(self, audio_path: str | Path, output_root: str | Path) -> dict[str, Path]:
        stem_dir = self.expected_stem_dir(audio_path, output_root)
        found = {name: stem_dir / f"{name}.wav" for name in self.STEMS}
        missing = [name for name, path in found.items() if not path.exists()]
        if missing:
            raise DemucsError(f"missing Demucs stems in {stem_dir}: {', '.join(missing)}")
        return found

    def separate(self, audio_path: str | Path, output_root: str | Path) -> dict[str, Path]:
        source = Path(audio_path)
        if not source.exists():
            raise FileNotFoundError(source)
        root = Path(output_root)
        root.mkdir(parents=True, exist_ok=True)
        if not self.available():
            raise DemucsError("Demucs is not installed; install optional MEngine stem dependencies")

        completed = subprocess.run(
            self.command(source, root),
            check=False,
            capture_output=True,
            text=True,
        )
        if completed.returncode != 0:
            details = (completed.stderr or completed.stdout).strip()
            raise DemucsError(f"Demucs failed ({completed.returncode}): {details}")
        return self.discover(source, root)
