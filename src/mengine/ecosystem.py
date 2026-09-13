from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class Integration:
    id: str
    repo: str
    roles: tuple[str, ...]
    integration_mode: str
    trust: str
    replaceable: bool
    license: str | None = None
    commercial_risk: str | None = None
    enabled_by_default: bool = True
    notes: str | None = None


def _coerce(entry: dict[str, Any]) -> Integration:
    return Integration(
        id=str(entry["id"]),
        repo=str(entry["repo"]),
        roles=tuple(str(role) for role in entry.get("role", [])),
        integration_mode=str(entry.get("integration_mode", "adapter")),
        trust=str(entry.get("trust", "unknown")),
        replaceable=bool(entry.get("replaceable", True)),
        license=entry.get("license"),
        commercial_risk=entry.get("commercial_risk"),
        enabled_by_default=bool(entry.get("enabled_by_default", True)),
        notes=entry.get("notes"),
    )


def load_ecosystem(path: str | Path = "config/music_ecosystem.yaml") -> list[Integration]:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    integrations: list[Integration] = []
    for section in ("blackmamba", "external"):
        integrations.extend(_coerce(entry) for entry in data.get(section, []))
    return integrations


def integrations_for_role(role: str, path: str | Path = "config/music_ecosystem.yaml") -> list[Integration]:
    return [item for item in load_ecosystem(path) if role in item.roles and item.enabled_by_default]


def commercial_review_queue(path: str | Path = "config/music_ecosystem.yaml") -> list[Integration]:
    risky = {"high", "unknown"}
    out: list[Integration] = []
    for item in load_ecosystem(path):
        risk = (item.commercial_risk or "unknown").lower()
        if any(marker in risk for marker in risky):
            out.append(item)
    return out
