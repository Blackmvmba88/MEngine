from mengine.visual.diagnostics import diagnose_wave_comparison


def test_diagnostics_detect_pitch_and_energy_errors() -> None:
    comparison = {
        "similarity": 0.70,
        "target": {
            "duration_seconds": 10.0,
            "fundamental_hz": 220.0,
            "rms_energy": 0.5,
            "spectral_centroid": 1000.0,
        },
        "deltas": {
            "duration_seconds": 0.1,
            "fundamental_hz": 110.0,
            "attack_time": 0.0,
            "rms_energy": -0.2,
            "spectral_centroid": 50.0,
        },
    }

    diagnostics = diagnose_wave_comparison(comparison)
    codes = {item.code for item in diagnostics}

    assert "fundamental_mismatch" in codes
    assert "energy_too_low" in codes


def test_clean_geometry_is_preserved() -> None:
    comparison = {
        "similarity": 0.99,
        "target": {
            "duration_seconds": 10.0,
            "fundamental_hz": 220.0,
            "rms_energy": 0.5,
            "spectral_centroid": 1000.0,
        },
        "deltas": {
            "duration_seconds": 0.0,
            "fundamental_hz": 0.0,
            "attack_time": 0.0,
            "rms_energy": 0.0,
            "spectral_centroid": 0.0,
        },
    }

    diagnostics = diagnose_wave_comparison(comparison)

    assert len(diagnostics) == 1
    assert diagnostics[0].code == "geometry_match"
    assert diagnostics[0].action == "preserve"
