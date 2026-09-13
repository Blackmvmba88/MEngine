from pathlib import Path

import numpy as np
import soundfile as sf

from mengine.core.judge.stems import judge_stems
from mengine.core.mambaspec.schema import Bass, Identity, MambaSpec, Song


def _tone(path: Path, freq: float, amp: float, sr: int = 22050) -> None:
    duration = 1.0
    t = np.linspace(0.0, duration, int(sr * duration), endpoint=False)
    sf.write(path, amp * np.sin(2 * np.pi * freq * t), sr)


def test_stem_judge_measures_bass_layer_without_claiming_semantics(tmp_path: Path) -> None:
    stems = {}
    setup = {
        "bass": (55.0, 0.4),
        "drums": (180.0, 0.2),
        "other": (440.0, 0.15),
        "vocals": (220.0, 0.1),
    }
    for name, (freq, amp) in setup.items():
        path = tmp_path / f"{name}.wav"
        _tone(path, freq, amp)
        stems[name] = path

    spec = MambaSpec(
        identity=Identity(label="BlackMamba RECORDS", artist="Iyari Gomez"),
        song=Song(duration=60, bpm=92),
        style={"primary": "reggae-dub"},
        bass=Bass(prominence=0.5, sub_energy=0.9),
    )

    result = judge_stems(spec, stems)

    assert 0.0 <= result.overall_score <= 1.0
    assert result.measurements["bass_prominence"] > result.measurements["vocals_rms"]
    assert result.measurements["bass_sub_energy"] > 0.8
    assert "vocal_density" in result.unresolved
