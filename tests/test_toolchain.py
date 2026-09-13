from __future__ import annotations

from mengine.toolchain import inspect_toolchain, preferred_capabilities


def test_toolchain_inspection_is_optional_and_stable():
    statuses = inspect_toolchain()
    names = {tool.name for tool in statuses}

    assert {"ffmpeg", "ffprobe", "sox", "aubio", "rubberband", "sndfile-info"} <= names
    assert all(isinstance(tool.available, bool) for tool in statuses)


def test_preferred_capabilities_always_resolve():
    capabilities = preferred_capabilities()

    assert capabilities["decode_encode"] in {"ffmpeg", "python"}
    assert capabilities["metadata_probe"] in {"ffprobe", "python"}
    assert capabilities["basic_dsp"] in {"sox", "python"}
    assert capabilities["onset_pitch"] in {"aubio", "librosa"}
    assert capabilities["time_stretch_pitch_shift"] in {"rubberband", "librosa"}
    assert capabilities["audio_container_info"] in {"sndfile-info", "soundfile"}
