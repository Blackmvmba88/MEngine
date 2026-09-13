from __future__ import annotations

from dataclasses import asdict, dataclass
from shutil import which
from subprocess import CalledProcessError, run


@dataclass(frozen=True)
class ToolStatus:
    name: str
    executable: str
    available: bool
    version: str | None = None

    def to_dict(self) -> dict[str, str | bool | None]:
        return asdict(self)


TOOLS: dict[str, tuple[str, ...]] = {
    "ffmpeg": ("ffmpeg", "-version"),
    "ffprobe": ("ffprobe", "-version"),
    "sox": ("sox", "--version"),
    "aubio": ("aubio", "--version"),
    "rubberband": ("rubberband", "--version"),
    "sndfile-info": ("sndfile-info", "--version"),
}


def _first_line(command: tuple[str, ...]) -> str | None:
    try:
        result = run(command, check=True, capture_output=True, text=True, timeout=5)
    except (CalledProcessError, OSError):
        return None

    output = (result.stdout or result.stderr).strip()
    return output.splitlines()[0] if output else None


def inspect_toolchain() -> list[ToolStatus]:
    """Return installed external audio capabilities without requiring them.

    MEngine treats Homebrew/CLI tools as accelerators. Python implementations remain
    valid fallbacks so the core is not permanently coupled to any one executable.
    """
    statuses: list[ToolStatus] = []

    for name, command in TOOLS.items():
        executable = command[0]
        resolved = which(executable)
        statuses.append(
            ToolStatus(
                name=name,
                executable=resolved or executable,
                available=resolved is not None,
                version=_first_line(command) if resolved else None,
            )
        )

    return statuses


def preferred_capabilities() -> dict[str, str]:
    """Resolve the fastest currently available implementation for common jobs."""
    available = {tool.name for tool in inspect_toolchain() if tool.available}

    return {
        "decode_encode": "ffmpeg" if "ffmpeg" in available else "python",
        "metadata_probe": "ffprobe" if "ffprobe" in available else "python",
        "basic_dsp": "sox" if "sox" in available else "python",
        "onset_pitch": "aubio" if "aubio" in available else "librosa",
        "time_stretch_pitch_shift": (
            "rubberband" if "rubberband" in available else "librosa"
        ),
        "audio_container_info": (
            "sndfile-info" if "sndfile-info" in available else "soundfile"
        ),
    }
