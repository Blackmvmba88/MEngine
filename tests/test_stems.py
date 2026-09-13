from pathlib import Path

import numpy as np
import soundfile as sf

from mengine.stems.analysis import analyze_stems
from mengine.stems.demucs import DemucsSeparator


def _tone(path: Path, freq: float, sr: int = 22050) -> None:
    duration = 1.0
    t = np.linspace(0.0, duration, int(sr * duration), endpoint=False)
    sf.write(path, 0.2 * np.sin(2 * np.pi * freq * t), sr)


def test_demucs_command_is_non_destructive_and_explicit(tmp_path: Path) -> None:
    source = tmp_path / "song.wav"
    source.touch()
    separator = DemucsSeparator(model="htdemucs", device="cpu")
    command = separator.command(source, tmp_path / "separated")

    assert "-m" in command
    assert "demucs" in command
    assert "htdemucs" in command
    assert "--float32" in command
    assert "-d" in command
    assert "cpu" in command
    assert str(source) == command[-1]


def test_discover_and_analyze_four_stems(tmp_path: Path) -> None:
    source = tmp_path / "song.wav"
    source.touch()
    separator = DemucsSeparator(model="htdemucs")
    stem_dir = separator.expected_stem_dir(source, tmp_path / "separated")
    stem_dir.mkdir(parents=True)

    frequencies = {"drums": 110.0, "bass": 55.0, "other": 330.0, "vocals": 220.0}
    for name, frequency in frequencies.items():
        _tone(stem_dir / f"{name}.wav", frequency)

    stems = separator.discover(source, tmp_path / "separated")
    analyses = analyze_stems(stems)

    assert set(stems) == set(DemucsSeparator.STEMS)
    assert set(analyses) == set(DemucsSeparator.STEMS)
    assert all(item.features.duration_seconds > 0 for item in analyses.values())
