from __future__ import annotations

import argparse
from pathlib import Path

from mengine.backends.ace_step import AceStepAPIBackend
from mengine.core.ear.extractors import extract_features
from mengine.core.judge.scorers import judge_features
from mengine.core.mambaspec.schema import Bass, Identity, MambaSpec, Song, Target, Vocals


def main() -> None:
    parser = argparse.ArgumentParser(description="Render the first real MEngine song through ACE-Step")
    parser.add_argument("--output", default=".mengine/ace-step/first-render.wav")
    parser.add_argument("--duration", type=int, default=30)
    parser.add_argument("--seed", type=int, default=88)
    args = parser.parse_args()

    spec = MambaSpec(
        identity=Identity(label="BlackMamba RECORDS", artist="Iyari Gomez"),
        song=Song(duration=args.duration, bpm=92, meter="4/4", key="F#", scale="minor"),
        style={"primary": "reggae-dub", "secondary": ["tech", "psychedelic"]},
        bass=Bass(prominence=0.72, sub_energy=0.88),
        vocals=Vocals(language="en", lyrics="[inst]"),
        target=Target(originality=0.95, minimum_quality=0.80),
    )

    backend = AceStepAPIBackend()
    if not backend.health():
        raise SystemExit(
            "ACE-Step API is not reachable. Start its local API first and set "
            "MENGINE_ACESTEP_URL if it is not on http://127.0.0.1:8001."
        )

    output = backend.generate(spec, Path(args.output), seed=args.seed)
    features = extract_features(str(output))
    judgment = judge_features(spec, features)

    print("BLACKMAMBA FIRST REAL RENDER")
    print(f"audio: {output}")
    print(f"bpm: {features.bpm:.2f} / target {spec.song.bpm:.2f}")
    print(f"key: {features.key} {features.mode}")
    print(f"loudness: {features.loudness_lufs:.2f} LUFS")
    print(f"score: {judgment.overall_score:.3f}")
    print(f"certifiable: {judgment.overall_score >= spec.target.minimum_quality}")


if __name__ == "__main__":
    main()
