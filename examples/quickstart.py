from pathlib import Path

from mengine.backends.dummy import DummyGenerator
from mengine.core.mambaspec.schema import Bass, Identity, MambaSpec, Rhythm, Song, Target, Vocals
from mengine.pipeline.closed_loop import ClosedLoopComposer


spec = MambaSpec(
    identity=Identity(label="BlackMamba RECORDS", artist="Iyari Gomez"),
    song=Song(duration=8, bpm=92, meter="4/4", key="A", scale="minor"),
    style={"primary": "reggae-dub", "secondary": ["psychedelic"]},
    rhythm=Rhythm(swing=0.12, syncopation=0.81, kick_density=0.34),
    bass=Bass(prominence=0.92, sub_energy=0.88),
    vocals=Vocals(language="en", density=0.31, repetition=0.82),
    target=Target(originality=0.95, minimum_quality=0.55),
)

print("MambaSpec:")
print(spec.to_yaml())

composer = ClosedLoopComposer(DummyGenerator(), max_iterations=2, seed=88)
result = composer.compose(spec, Path(".mengine/quickstart"))

print("Closed-loop result:")
print(f"  status: {result['status']}")
print(f"  score: {result.get('score', result.get('best_iteration', {}).get('judgment', {}).get('overall_score'))}")
