from __future__ import annotations

import numpy as np
import soundfile as sf

from mengine import analyze_audio


def test_analyze_audio_returns_stable_basic_features(tmp_path):
    sr = 22050
    duration = 2.0
    t = np.linspace(0.0, duration, int(sr * duration), endpoint=False)
    y = 0.25 * np.sin(2 * np.pi * 440.0 * t)

    path = tmp_path / "tone.wav"
    sf.write(path, y, sr)

    features = analyze_audio(path)

    assert features.sample_rate == sr
    assert 1.99 <= features.duration_seconds <= 2.01
    assert features.rms_mean > 0
    assert features.spectral_centroid_hz > 0
    assert features.spectral_bandwidth_hz >= 0
    assert 0 <= features.zero_crossing_rate <= 1
