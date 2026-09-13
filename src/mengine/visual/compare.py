from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import librosa
import numpy as np

from mengine.wave_geometry import analyze_wave_geometry, spectrogram_mesh


@dataclass(frozen=True)
class WaveComparison:
    target: dict[str, Any]
    candidate: dict[str, Any]
    deltas: dict[str, float]
    similarity: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "target": self.target,
            "candidate": self.candidate,
            "deltas": self.deltas,
            "similarity": self.similarity,
        }


def _load_mono(path: str | Path, sr: int = 22050) -> tuple[np.ndarray, int]:
    y, loaded_sr = librosa.load(str(path), sr=sr, mono=True)
    return y.astype(np.float64), loaded_sr


def _normalize(value: float, scale: float) -> float:
    if scale <= 0:
        return 0.0
    return min(abs(value) / scale, 1.0)


def compare_wave_geometry(target_path: str | Path, candidate_path: str | Path) -> WaveComparison:
    target_y, target_sr = _load_mono(target_path)
    candidate_y, candidate_sr = _load_mono(candidate_path)

    target_geo = analyze_wave_geometry(target_y, target_sr)
    candidate_geo = analyze_wave_geometry(candidate_y, candidate_sr)

    metrics = {
        "duration_seconds": candidate_geo.duration_seconds - target_geo.duration_seconds,
        "peak_amplitude": candidate_geo.peak_amplitude - target_geo.peak_amplitude,
        "crest_factor": candidate_geo.crest_factor - target_geo.crest_factor,
        "attack_time": candidate_geo.attack_time - target_geo.attack_time,
        "attack_angle_deg": candidate_geo.attack_angle_deg - target_geo.attack_angle_deg,
        "absolute_area": candidate_geo.absolute_area - target_geo.absolute_area,
        "envelope_area": candidate_geo.envelope_area - target_geo.envelope_area,
        "rms_energy": candidate_geo.rms_energy - target_geo.rms_energy,
        "spectral_centroid": candidate_geo.spectral_centroid - target_geo.spectral_centroid,
        "fundamental_hz": candidate_geo.fundamental_hz - target_geo.fundamental_hz,
    }

    penalties = [
        _normalize(metrics["duration_seconds"], max(target_geo.duration_seconds, 1.0)),
        _normalize(metrics["peak_amplitude"], max(target_geo.peak_amplitude, 0.05)),
        _normalize(metrics["crest_factor"], max(target_geo.crest_factor, 1.0)),
        _normalize(metrics["attack_time"], max(target_geo.attack_time, 0.05)),
        _normalize(metrics["attack_angle_deg"], 90.0),
        _normalize(metrics["envelope_area"], max(target_geo.envelope_area, 0.01)),
        _normalize(metrics["rms_energy"], max(target_geo.rms_energy, 0.01)),
        _normalize(metrics["spectral_centroid"], max(target_geo.spectral_centroid, 100.0)),
        _normalize(metrics["fundamental_hz"], max(target_geo.fundamental_hz, 40.0)),
    ]
    similarity = float(np.clip(1.0 - np.mean(penalties), 0.0, 1.0))

    return WaveComparison(
        target=target_geo.to_dict(),
        candidate=candidate_geo.to_dict(),
        deltas={key: float(value) for key, value in metrics.items()},
        similarity=similarity,
    )


def build_visual_comparison_payload(
    target_path: str | Path,
    candidate_path: str | Path,
    *,
    max_points: int = 4096,
) -> dict[str, Any]:
    target_y, target_sr = _load_mono(target_path)
    candidate_y, candidate_sr = _load_mono(candidate_path)

    def downsample(y: np.ndarray) -> list[float]:
        if y.size <= max_points:
            return y.tolist()
        indices = np.linspace(0, y.size - 1, max_points).astype(int)
        return y[indices].tolist()

    comparison = compare_wave_geometry(target_path, candidate_path)
    target_mesh = spectrogram_mesh(target_y, target_sr)
    candidate_mesh = spectrogram_mesh(candidate_y, candidate_sr)

    return {
        "comparison": comparison.to_dict(),
        "target": {
            "sample_rate": target_sr,
            "waveform": downsample(target_y),
            "mesh": target_mesh,
        },
        "candidate": {
            "sample_rate": candidate_sr,
            "waveform": downsample(candidate_y),
            "mesh": candidate_mesh,
        },
    }
