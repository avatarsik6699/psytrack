"""Tests for Phase 06 B2: card color computation."""

from __future__ import annotations

import pytest
from datetime import datetime, timedelta, timezone

from app.modules.patients.color_service import ColorInputs, compute_card_color

NOW = datetime(2026, 5, 18, tzinfo=timezone.utc)
OLD = NOW - timedelta(days=30)


@pytest.mark.parametrize(
    "inputs,expected",
    [
        # Gray: no therapy start
        (ColorInputs(now=NOW), "gray"),
        # Gray: < 7 days in therapy
        (ColorInputs(therapy_start=NOW - timedelta(days=5), now=NOW), "gray"),
        # Gray: therapy OK but no test results
        (ColorInputs(therapy_start=OLD, now=NOW), "gray"),
        # Red: SE severity 4
        (ColorInputs(se_severities=[4], therapy_start=OLD, now=NOW), "red"),
        # Red: SE severity 3
        (ColorInputs(se_severities=[3], therapy_start=OLD, now=NOW), "red"),
        # Red: negative clinical dynamics (score worse than baseline with "lower" direction)
        (
            ColorInputs(
                se_severities=[],
                therapy_start=OLD,
                baseline_score=50,
                latest_score=80,
                control_point_days=14,
                response_threshold_pct=30,
                response_threshold_abs=20,
                improvement_direction="lower",
                now=NOW,
            ),
            "red",
        ),
        # Yellow: SE severity 2
        (ColorInputs(se_severities=[2], therapy_start=OLD, now=NOW), "yellow"),
        # Yellow: 4 × severity-1
        (ColorInputs(se_severities=[1, 1, 1, 1], therapy_start=OLD, now=NOW), "yellow"),
        # Yellow: improvement not reached at control point
        (
            ColorInputs(
                se_severities=[],
                therapy_start=OLD,
                baseline_score=100,
                latest_score=90,
                control_point_days=14,
                response_threshold_pct=30,
                response_threshold_abs=20,
                improvement_direction="lower",
                now=NOW,
            ),
            "yellow",
        ),
        # Green: positive dynamics, low SE (1 × sev-1 is fine)
        (
            ColorInputs(
                se_severities=[1],
                therapy_start=OLD,
                baseline_score=100,
                latest_score=50,
                control_point_days=14,
                response_threshold_pct=30,
                response_threshold_abs=20,
                improvement_direction="lower",
                now=NOW,
            ),
            "green",
        ),
        # Gray fallback: control point not yet reached (unknown dynamics, no bad SEs)
        (
            ColorInputs(
                se_severities=[],
                therapy_start=OLD,
                baseline_score=100,
                latest_score=90,
                control_point_days=60,
                response_threshold_pct=30,
                response_threshold_abs=20,
                improvement_direction="lower",
                now=NOW,
            ),
            "gray",
        ),
        # Green: "higher" direction — score improved above baseline
        (
            ColorInputs(
                se_severities=[],
                therapy_start=OLD,
                baseline_score=40,
                latest_score=80,
                control_point_days=14,
                response_threshold_pct=30,
                response_threshold_abs=20,
                improvement_direction="higher",
                now=NOW,
            ),
            "green",
        ),
    ],
)
def test_compute_card_color(inputs: ColorInputs, expected: str) -> None:
    assert compute_card_color(inputs) == expected
