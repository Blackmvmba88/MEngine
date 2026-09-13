.PHONY: install install-stems test lint check quickstart first-render doctor

install:
	python3 -m pip install -e '.[dev]'

install-stems:
	python3 -m pip install -e '.[stems]'

test:
	pytest -q

lint:
	ruff check .

check: lint test

quickstart:
	python3 examples/quickstart.py

first-render:
	python3 examples/ace_step_render.py --duration 30 --seed 88

doctor:
	mengine-doctor
