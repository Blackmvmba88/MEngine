from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


def load_school_index(path: str | Path = "config/schools.yaml") -> dict[str, Any]:
    return yaml.safe_load(Path(path).read_text(encoding="utf-8"))


def schools_for_stage(stage: str, path: str | Path = "config/schools.yaml") -> list[str]:
    data = load_school_index(path)
    routing = data.get("routing", {})
    return list(routing.get(stage, routing.get("unknown", {}).get("load", [])) if isinstance(routing.get(stage), list) else routing.get(stage, routing.get("unknown", {})).get("load", []))
