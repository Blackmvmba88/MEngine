from pathlib import Path

from mengine.backends.dummy import DummyGenerator
from mengine.core.mambaspec.schema import Identity, MambaSpec, Song, Target
from mengine.pipeline.closed_loop import ClosedLoopComposer


def test_closed_loop_certifies_and_writes_audio(tmp_path: Path):
    spec = MambaSpec(
        identity=Identity(label="BlackMamba RECORDS", artist="Iyari Gomez"),
        song=Song(duration=5, bpm=92),
        style={"primary": "reggae-dub"},
        target=Target(minimum_quality=0.0),
    )
    composer = ClosedLoopComposer(DummyGenerator(), max_iterations=2, seed=88)
    result = composer.compose(spec, tmp_path)

    assert result["status"] == "certified"
    assert result["iteration"] == 1
    assert Path(result["path"]).exists()
    assert len(result["history"]) == 1
