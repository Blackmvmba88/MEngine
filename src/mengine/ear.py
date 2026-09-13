from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path

import librosa
import numpy as np


@dataclass(frozen=True)
class AudioFeatures:
    path: str
    sample_rate: int
    duration_seconds: float
    tempo_bpm: float
    rms_mean: float
    spectral_centroid_hz: float
    spectral_bandwidth_hz: float
    zero_crossing_rate: float

    def to_dict(self) -> dict[str, float | int | str]:
        return asdict(self)


def analyze_audio(path: str | Path, *, sample_rate: int | None = None) -> AudioFeatures:
    """Analyze one audio file and return deterministic first-pass features.

    This is intentionally small. It establishes the contract for Mamba Ear before
    adding key detection, structure, loudness, stems, embeddings, or learned judges.
    """
    source = Path(path)
    if not source.exists():
        raise FileNotFoundError(source)

    y, sr = librosa.load(source, sr=sample_rate, mono=True)
    if y.size == 0:
        raise ValueError(f"Audio file is empty: {source}")

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    rms = librosa.feature.rms(y=y)
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    zcr = librosa.feature.zero_crossing_rate(y)

    tempo_value = float(np.asarray(tempo).reshape(-1)[0])

    return AudioFeatures(
        path=str(source),
        sample_rate=int(sr),
        duration_seconds=float(librosa.get_duration(y=y, sr=sr)),
        tempo_bpm=tempo_value,
        rms_mean=float(np.mean(rms)),
        spectral_centroid_hz=float(np.mean(centroid)),
        spectral_bandwidth_hz=float(np.mean(bandwidth)),
        zero_crossing_rate=float(np.mean(zcr)),
    )
