from pathlib import Path

from mengine.ecosystem import commercial_review_queue, integrations_for_role, load_ecosystem


REGISTRY = Path("config/music_ecosystem.yaml")


def test_registry_loads_unique_integrations() -> None:
    integrations = load_ecosystem(REGISTRY)
    ids = [item.id for item in integrations]
    assert integrations
    assert len(ids) == len(set(ids))


def test_song_generation_has_default_backend() -> None:
    backends = integrations_for_role("full-song-generation", REGISTRY)
    assert any(item.id == "ace_step_15" for item in backends)


def test_pitch_has_multiple_paths() -> None:
    pitch_related = {
        item.id
        for item in load_ecosystem(REGISTRY)
        if {"pitch-detection", "polyphonic-pitch"}.intersection(item.roles)
    }
    assert {"tuner", "basic_pitch"}.issubset(pitch_related)


def test_essentia_requires_commercial_review() -> None:
    risky = {item.id for item in commercial_review_queue(REGISTRY)}
    assert "essentia" in risky
