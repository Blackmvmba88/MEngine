from __future__ import annotations

from typing import Any

import yaml
from pydantic import BaseModel, Field


class Identity(BaseModel):
    label: str
    artist: str


class Song(BaseModel):
    duration: int = Field(..., ge=5, le=600)
    bpm: float = Field(..., ge=30, le=300)
    meter: str = "4/4"
    key: str | None = None
    scale: str | None = None


class Rhythm(BaseModel):
    swing: float = Field(0.0, ge=0.0, le=1.0)
    syncopation: float = Field(0.5, ge=0.0, le=1.0)
    kick_density: float = Field(0.5, ge=0.0, le=1.0)


class Bass(BaseModel):
    prominence: float = Field(0.5, ge=0.0, le=1.0)
    sub_energy: float = Field(0.5, ge=0.0, le=1.0)


class Vocals(BaseModel):
    language: str = "en"
    density: float = Field(0.5, ge=0.0, le=1.0)
    repetition: float = Field(0.5, ge=0.0, le=1.0)
    lyrics: str | None = None


class Target(BaseModel):
    originality: float = Field(0.8, ge=0.0, le=1.0)
    minimum_quality: float = Field(0.8, ge=0.0, le=1.0)


class MambaSpec(BaseModel):
    version: str = "0.1"
    identity: Identity
    song: Song
    style: dict[str, Any]
    rhythm: Rhythm = Field(default_factory=Rhythm)
    bass: Bass = Field(default_factory=Bass)
    vocals: Vocals = Field(default_factory=Vocals)
    target: Target = Field(default_factory=Target)

    def to_yaml(self) -> str:
        return yaml.safe_dump(self.model_dump(mode="json"), sort_keys=False, allow_unicode=True)
