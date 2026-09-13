from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class Playbook:
    id: str
    trigger: str
    actions: tuple[str, ...]
    fallback: str | None
    stop_condition: str


def load_playbooks(path: str | Path = "config/playbooks.yaml") -> dict[str, Playbook]:
    data: dict[str, Any] = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    out: dict[str, Playbook] = {}
    for entry in data.get("playbooks", []):
        playbook = Playbook(
            id=str(entry["id"]),
            trigger=str(entry["trigger"]),
            actions=tuple(str(action) for action in entry.get("action", [])),
            fallback=entry.get("fallback"),
            stop_condition=str(entry["stop_condition"]),
        )
        if playbook.trigger in out:
            raise ValueError(f"duplicate playbook trigger: {playbook.trigger}")
        out[playbook.trigger] = playbook
    return out


def resolve_playbook(trigger: str, path: str | Path = "config/playbooks.yaml") -> Playbook:
    playbooks = load_playbooks(path)
    return playbooks.get(trigger, playbooks["no_known_playbook"])
