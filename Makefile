.PHONY: install test lint check quickstart doctor

install:
	python3 -m pip install -e '.[dev]'

test:
	pytest -q

lint:
	ruff check .

check: lint test

quickstart:
	python3 examples/quickstart.py

doctor:
	mengine-doctor
