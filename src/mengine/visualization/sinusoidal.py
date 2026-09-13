from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import librosa
import numpy as np

from mengine.wave_geometry import spectrogram_mesh


@dataclass(frozen=True)
class WaveView:
    time: np.ndarray
    amplitude: np.ndarray
    envelope: np.ndarray
    mesh_x: np.ndarray
    mesh_y: np.ndarray
    mesh_z: np.ndarray


def build_wave_view(audio_path: str | Path, sr: int = 22050) -> WaveView:
    """Prepare reusable waveform + envelope + 3D mesh data for BlackMamba readers."""
    y, actual_sr = librosa.load(str(audio_path), sr=sr, mono=True)
    if y.size == 0:
        raise ValueError("empty audio")

    time = np.arange(y.size, dtype=float) / float(actual_sr)
    envelope = np.abs(librosa.onset.onset_strength(y=y, sr=actual_sr))
    env_time = librosa.times_like(envelope, sr=actual_sr)
    envelope_interp = np.interp(time, env_time, envelope, left=0.0, right=0.0)

    mesh_x, mesh_y, mesh_z = spectrogram_mesh(y, actual_sr)
    return WaveView(
        time=time,
        amplitude=y,
        envelope=envelope_interp,
        mesh_x=mesh_x,
        mesh_y=mesh_y,
        mesh_z=mesh_z,
    )


def to_serializable(view: WaveView, max_points: int = 5000) -> dict[str, Any]:
    """Downsample visualization payloads for web/React consumers."""
    if max_points < 10:
        raise ValueError("max_points must be >= 10")

    step = max(1, int(np.ceil(view.time.size / max_points)))
    return {
        "waveform": {
            "time": view.time[::step].tolist(),
            "amplitude": view.amplitude[::step].tolist(),
            "envelope": view.envelope[::step].tolist(),
        },
        "mesh": {
            "x": view.mesh_x.tolist(),
            "y": view.mesh_y.tolist(),
            "z": view.mesh_z.tolist(),
        },
    }
