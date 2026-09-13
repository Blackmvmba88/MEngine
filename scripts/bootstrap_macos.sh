#!/usr/bin/env bash
set -euo pipefail

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required for the macOS acceleration layer."
  echo "Install it from https://brew.sh and rerun this script."
  exit 1
fi

echo "[MEngine] Installing audio accelerators from Brewfile..."
brew bundle --file "$(cd "$(dirname "$0")/.." && pwd)/Brewfile"

echo "[MEngine] Installing Python package in editable mode..."
python3 -m pip install -e '.[dev]'

echo "[MEngine] Toolchain ready."
python3 -m mengine.doctor
