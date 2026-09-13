from __future__ import annotations

from dataclasses import asdict, dataclass

import librosa
import numpy as np
import pyloudnorm as pyln


@dataclass(frozen=True)
class AudioFeatures:
    duration_seconds: float
    bpm: float
    key: str
    mode: str
    key_confidence: float
    loudness_lufs: float
    spectral_centroid_hz: float
    zero_crossing_rate: float

    def to_dict(self) -> dict[str, float | str]:
        return asdict(self)


_MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
_MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
_NOTES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")


def _estimate_key(chroma: np.ndarray) -> tuple[str, str, float]:
    profile = np.mean(chroma, axis=1)
    if not np.any(profile):
        return "unknown", "unknown", 0.0
    profile = (profile - profile.mean()) / (profile.std() + 1e-9)
    candidates: list[tuple[float, str, str]] = []
    for tonic in range(12):
        for mode, template in (("major", _MAJOR_PROFILE), ("minor", _MINOR_PROFILE)):
            rolled = np.roll(template, tonic)
            rolled = (rolled - rolled.mean()) / (rolled.std() + 1e-9)
            score = float(np.dot(profile, rolled) / len(profile))
            candidates.append((score, _NOTES[tonic], mode))
    candidates.sort(reverse=True)
    best, second = candidates[0], candidates[1]
    confidence = float(np.clip((best[0] - second[0]) / 2.0 + 0.5, 0.0, 1.0))
    return best[1], best[2], confidence


def extract_features(audio_path: str, sr: int | None = 44100) -> AudioFeatures:
    y, sr = librosa.load(audio_path, sr=sr, mono=True)
    if y.size == 0:
        raise ValueError("audio contains no samples")

    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    bpm, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
    bpm_value = float(np.asarray(bpm).reshape(-1)[0])

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    key, mode, key_confidence = _estimate_key(chroma)

    meter = pyln.Meter(sr)
    loudness = float(meter.integrated_loudness(y.astype(np.float64)))

    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))

    return AudioFeatures(
        duration_seconds=float(librosa.get_duration(y=y, sr=sr)),
        bpm=bpm_value,
        key=key,
        mode=mode,
        key_confidence=key_confidence,
        loudness_lufs=loudness,
        spectral_centroid_hz=centroid,
        zero_crossing_rate=zcr,
    )
