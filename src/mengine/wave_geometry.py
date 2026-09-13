from __future__ import annotations

from dataclasses import asdict, dataclass
from math import atan, degrees
from pathlib import Path

import librosa
import numpy as np


@dataclass(frozen=True)
class WaveGeometry:
    path: str
    sample_rate: int
    duration_seconds: float
    peak_amplitude: float
    rms_energy: float
    crest_factor: float
    attack_time_seconds: float
    attack_slope: float
    attack_angle_deg: float
    positive_area: float
    negative_area: float
    absolute_area: float
    envelope_area: float
    zero_crossings: int
    spectral_centroid_hz: float
    fundamental_hz: float | None

    def to_dict(self) -> dict[str, float | int | str | None]:
        return asdict(self)


def analyze_wave_geometry(path: str | Path, *, sample_rate: int | None = None) -> WaveGeometry:
    source = Path(path)
    if not source.exists():
        raise FileNotFoundError(source)

    y, sr = librosa.load(source, sr=sample_rate, mono=True)
    if y.size == 0:
        raise ValueError(f"Audio file is empty: {source}")

    dt = 1.0 / sr
    absolute = np.abs(y)
    peak_index = int(np.argmax(absolute))
    peak = float(absolute[peak_index])
    rms = float(np.sqrt(np.mean(np.square(y))))
    crest_factor = float(peak / rms) if rms > 0 else 0.0

    attack_time = float(peak_index / sr)
    attack_slope = float(peak / attack_time) if attack_time > 0 else 0.0
    # Normalize slope to amplitude-per-second geometry before angular mapping.
    attack_angle = float(degrees(atan(attack_slope)))

    positive_area = float(np.trapz(np.clip(y, 0.0, None), dx=dt))
    negative_area = float(np.trapz(np.clip(-y, 0.0, None), dx=dt))
    absolute_area = float(np.trapz(absolute, dx=dt))

    envelope = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    envelope_time_step = 512 / sr
    envelope_area = float(np.trapz(envelope, dx=envelope_time_step))

    zero_crossings = int(np.sum(librosa.zero_crossings(y, pad=False)))
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)

    f0, _, _ = librosa.pyin(
        y,
        fmin=librosa.note_to_hz("C2"),
        fmax=librosa.note_to_hz("C7"),
        sr=sr,
    )
    voiced = f0[np.isfinite(f0)]
    fundamental = float(np.median(voiced)) if voiced.size else None

    return WaveGeometry(
        path=str(source),
        sample_rate=int(sr),
        duration_seconds=float(librosa.get_duration(y=y, sr=sr)),
        peak_amplitude=peak,
        rms_energy=rms,
        crest_factor=crest_factor,
        attack_time_seconds=attack_time,
        attack_slope=attack_slope,
        attack_angle_deg=attack_angle,
        positive_area=positive_area,
        negative_area=negative_area,
        absolute_area=absolute_area,
        envelope_area=envelope_area,
        zero_crossings=zero_crossings,
        spectral_centroid_hz=float(np.mean(centroid)),
        fundamental_hz=fundamental,
    )


def spectrogram_mesh(
    path: str | Path,
    *,
    n_fft: int = 2048,
    hop_length: int = 512,
    sample_rate: int | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return X=time, Y=frequency, Z=magnitude arrays for 3D rendering."""
    y, sr = librosa.load(path, sr=sample_rate, mono=True)
    spectrum = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))
    times = librosa.frames_to_time(np.arange(spectrum.shape[1]), sr=sr, hop_length=hop_length)
    frequencies = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
    x, y_grid = np.meshgrid(times, frequencies)
    return x, y_grid, spectrum
