from pathlib import Path

from mengine.playbooks import load_playbooks, resolve_playbook


REGISTRY = Path("config/playbooks.yaml")


def test_playbooks_have_unique_triggers() -> None:
    playbooks = load_playbooks(REGISTRY)
    assert playbooks
    assert "no_known_playbook" in playbooks


def test_generation_miss_routes_to_correction() -> None:
    playbook = resolve_playbook("candidate_score_below_target", REGISTRY)
    assert playbook.id == "generation_miss"
    assert "build_error_map" in playbook.actions
    assert "remeasure" in playbook.actions


def test_unknown_trigger_enters_safe_mode() -> None:
    playbook = resolve_playbook("something_never_seen_before", REGISTRY)
    assert playbook.id == "unknown"
    assert "enter_safe_mode" in playbook.actions
    assert "prohibit_destructive_changes" in playbook.actions
