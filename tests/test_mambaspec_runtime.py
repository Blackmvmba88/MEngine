import pytest

from mengine.core.mambaspec.schema import Identity, MambaSpec, Song


def test_valid_spec_serializes_yaml():
    spec = MambaSpec(
        identity=Identity(label="BlackMamba RECORDS", artist="Iyari Gomez"),
        song=Song(duration=60, bpm=92),
        style={"primary": "reggae-dub"},
    )
    rendered = spec.to_yaml()
    assert "BlackMamba RECORDS" in rendered
    assert spec.song.bpm == 92


def test_invalid_bpm_is_rejected():
    with pytest.raises(ValueError):
        Song(duration=60, bpm=999)
