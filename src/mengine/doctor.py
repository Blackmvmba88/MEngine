from __future__ import annotations

from .toolchain import inspect_toolchain, preferred_capabilities


def main() -> None:
    print("BLACKMAMBA MUSIC ENGINE — TOOLCHAIN DOCTOR")
    print("=" * 46)

    for tool in inspect_toolchain():
        state = "OK" if tool.available else "MISSING"
        version = f" | {tool.version}" if tool.version else ""
        print(f"{state:7} {tool.name:18} {tool.executable}{version}")

    print("\nPreferred capability routing")
    print("-" * 29)
    for capability, backend in preferred_capabilities().items():
        print(f"{capability:26} -> {backend}")


if __name__ == "__main__":
    main()
