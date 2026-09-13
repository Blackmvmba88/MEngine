from mengine.backends.ace_step import AceStepAPIBackend
from mengine.core.mambaspec.schema import Identity, MambaSpec, Song, Vocals


def _spec() -> MambaSpec:
    return MambaSpec(
        identity=Identity(label="BlackMamba RECORDS", artist="Iyari Gomez"),
        song=Song(duration=60, bpm=92, meter="4/4", key="F#", scale="minor"),
        style={"primary": "reggae-dub", "secondary": ["psychedelic", "tech"]},
        vocals=Vocals(language="en", density=0.3, repetition=0.8),
    )


def test_payload_preserves_declarative_music_controls() -> None:
    backend = AceStepAPIBackend(model="acestep-v15-turbo")
    payload = backend.build_payload(_spec(), seed=88)

    assert payload["prompt"] == "reggae-dub, psychedelic, tech"
    assert payload["lyrics"] == "[inst]"
    assert payload["bpm"] == 92
    assert payload["key_scale"] == "F# Minor"
    assert payload["time_signature"] == "4"
    assert payload["audio_duration"] == 60.0
    assert payload["audio_format"] == "wav"
    assert payload["seed"] == 88
    assert payload["use_random_seed"] is False
    assert payload["model"] == "acestep-v15-turbo"


def test_payload_uses_explicit_lyrics_when_present() -> None:
    spec = _spec()
    spec.vocals.lyrics = "[Verse]\nBlackMamba rise"
    payload = AceStepAPIBackend().build_payload(spec, seed=1)
    assert payload["lyrics"] == "[Verse]\nBlackMamba rise"


def test_result_parser_extracts_documented_audio_reference() -> None:
    raw = '[{"file":"/v1/audio?path=/tmp/song.wav","metas":{"bpm":92}}]'
    assert AceStepAPIBackend._extract_audio_ref(raw) == "/v1/audio?path=/tmp/song.wav"
