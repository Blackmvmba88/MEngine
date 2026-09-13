from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from mengine.backends.base import GeneratorBackend
from mengine.core.mambaspec.schema import MambaSpec


class AceStepError(RuntimeError):
    """Raised when ACE-Step cannot complete a generation request."""


class AceStepAPIBackend(GeneratorBackend):
    """ACE-Step 1.5 adapter using its documented localhost REST API.

    MEngine owns the musical contract; ACE-Step remains a replaceable renderer.
    The adapter intentionally speaks HTTP instead of importing ACE-Step internals so
    the two projects can evolve and be licensed/versioned independently.
    """

    def __init__(
        self,
        base_url: str | None = None,
        *,
        api_key: str | None = None,
        model: str | None = None,
        poll_interval: float = 1.0,
        timeout: float = 600.0,
        thinking: bool = True,
    ) -> None:
        self.base_url = (base_url or os.environ.get("MENGINE_ACESTEP_URL") or "http://127.0.0.1:8001").rstrip("/") + "/"
        self.api_key = api_key or os.environ.get("MENGINE_ACESTEP_API_KEY")
        self.model = model or os.environ.get("MENGINE_ACESTEP_MODEL")
        self.poll_interval = poll_interval
        self.timeout = timeout
        self.thinking = thinking

    def supports(self, style: str) -> bool:
        return bool(style.strip())

    def health(self) -> bool:
        try:
            response = self._request_json("GET", "health")
        except AceStepError:
            return False
        return response.get("code", 200) == 200

    def build_payload(self, spec: MambaSpec, *, seed: int) -> dict[str, Any]:
        style = spec.style.get("primary", "")
        secondary = spec.style.get("secondary", [])
        if isinstance(secondary, str):
            secondary = [secondary]

        descriptors = [str(style), *(str(item) for item in secondary)]
        descriptors = [item.strip() for item in descriptors if item.strip()]
        prompt = ", ".join(descriptors) or "instrumental music"

        # MambaSpec v0.1 does not yet carry full lyrics. Instrumental is therefore
        # explicit rather than allowing an upstream model to invent words silently.
        lyrics = "[inst]"
        key_scale = ""
        if spec.song.key:
            key_scale = spec.song.key
            if spec.song.scale:
                key_scale = f"{key_scale} {spec.song.scale.title()}"

        payload: dict[str, Any] = {
            "prompt": prompt,
            "lyrics": lyrics,
            "thinking": self.thinking,
            "use_format": False,
            "vocal_language": spec.vocals.language,
            "audio_format": "wav",
            "audio_duration": float(spec.song.duration),
            "bpm": int(round(spec.song.bpm)),
            "key_scale": key_scale,
            "time_signature": spec.song.meter,
            "use_random_seed": False,
            "seed": int(seed),
            "batch_size": 1,
            "task_type": "text2music",
        }
        if self.model:
            payload["model"] = self.model
        return payload

    def generate(self, spec: MambaSpec, output_path: Path, *, seed: int) -> Path:
        if not self.supports(str(spec.style.get("primary", ""))):
            raise AceStepError("ACE-Step backend requires a non-empty primary style")

        release = self._request_json("POST", "release_task", self.build_payload(spec, seed=seed))
        data = release.get("data") or {}
        task_id = data.get("task_id")
        if not task_id:
            raise AceStepError(f"ACE-Step did not return task_id: {release}")

        audio_ref = self._wait_for_audio(str(task_id))
        audio_bytes = self._request_bytes(audio_ref)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(audio_bytes)
        if output_path.stat().st_size == 0:
            raise AceStepError("ACE-Step returned an empty audio file")
        return output_path

    def _wait_for_audio(self, task_id: str) -> str:
        deadline = time.monotonic() + self.timeout
        while time.monotonic() < deadline:
            response = self._request_json("POST", "query_result", {"task_id_list": [task_id]})
            rows = response.get("data") or []
            row = rows[0] if rows else {}
            status = int(row.get("status", 0))
            if status == 1:
                return self._extract_audio_ref(row.get("result"))
            if status == 2:
                raise AceStepError(f"ACE-Step task failed: {row}")
            time.sleep(self.poll_interval)
        raise AceStepError(f"ACE-Step task timed out after {self.timeout:.1f}s")

    @staticmethod
    def _extract_audio_ref(raw_result: Any) -> str:
        if isinstance(raw_result, str):
            try:
                parsed = json.loads(raw_result)
            except json.JSONDecodeError as exc:
                raise AceStepError("ACE-Step result was not valid JSON") from exc
        else:
            parsed = raw_result

        if isinstance(parsed, dict):
            parsed = [parsed]
        if not isinstance(parsed, list) or not parsed:
            raise AceStepError("ACE-Step result contained no audio entries")

        ref = parsed[0].get("file")
        if not ref:
            raise AceStepError("ACE-Step result did not contain an audio file reference")
        return str(ref)

    def _headers(self, content_type: str | None = None) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if content_type:
            headers["Content-Type"] = content_type
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _request_json(self, method: str, endpoint: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = Request(
            urljoin(self.base_url, endpoint),
            data=body,
            method=method,
            headers=self._headers("application/json" if body is not None else None),
        )
        try:
            with urlopen(request, timeout=30) as response:
                decoded = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise AceStepError(f"ACE-Step request failed: {exc}") from exc
        if decoded.get("error"):
            raise AceStepError(f"ACE-Step API error: {decoded['error']}")
        return decoded

    def _request_bytes(self, audio_ref: str) -> bytes:
        url = audio_ref if audio_ref.startswith(("http://", "https://")) else urljoin(self.base_url, audio_ref.lstrip("/"))
        request = Request(url, method="GET", headers=self._headers())
        try:
            with urlopen(request, timeout=120) as response:
                return response.read()
        except (HTTPError, URLError, TimeoutError) as exc:
            raise AceStepError(f"ACE-Step audio download failed: {exc}") from exc
