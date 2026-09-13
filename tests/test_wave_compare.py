from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf

from mengine.visual.compare import build_visual_comparison_payload, compare_wave_geometry


def _write_sine(path: Path, freq: float, amp: float = 0.5, duration: float = 1.0, sr: int = 22050) -> None:
    t = np.linspace(0.0, duration, int(sr * duration), endpoint=False)
    y = amp * np.sin(2.0 * np.pi * freq * t)
    sf.write(path, y, sr)


def test_identical_waveforms_are_nearly_identical(tmp_path: Path) -> None:
    target = tmp_path / "target.wav"
    candidate = tmp_path / "candidate.wav"
    _write_sine(target, 220.0)
    _write_sine(candidate, 220.0)

    comparison = compare_wave_geometry(target, candidate)

    assert comparison.similarity > 0.98
    assert abs(comparison.deltas["fundamental_hz"]) < 5.0


def test_different_waveforms_reduce_similarity(tmp_path: Path) -> None:
    target = tmp_path / "target.wav"
    candidate = tmp_path / "candidate.wav"
    _write_sine(target, 220.0, amp=0.5)
    _write_sine(candidate, 440.0, amp=0.15)

    comparison = compare_wave_geometry(target, candidate)

    assert comparison.similarity < 0.95
    assert abs(comparison.deltas["fundamental_hz"]) > 100.0


def test_visual_payload_contains_waveforms_and_meshes(tmp_path: Path) -> None:
    target = tmp_path / "target.wav"
    candidate = tmp_path / "candidate.wav"
    _write_sine(target, 220.0)
    _write_sine(candidate, 330.0)

    payload = build_visual_comparison_payload(target, candidate, max_points=256)

    assert len(payload["target"]["waveform"]) <= 256
    assert len(payload["candidate"]["waveform"]) <= 256
    assert "mesh" in payload["target"]
    assert "comparison" in payload
