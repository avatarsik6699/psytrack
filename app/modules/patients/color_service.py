from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

CardColor = Literal["red", "yellow", "green", "gray"]

GRAY_THRESHOLD_DAYS = 7


@dataclass
class ColorInputs:
    se_severities: list[int] = field(default_factory=list)
    # active (non-deleted, non-resolved) PatientSideEffect.severity values

    therapy_start: datetime | None = None
    # earliest started_at from active PatientMedication records

    baseline_score: int | None = None
    # TestCompletion.score where baseline=True (most recent per patient_scale_id)

    latest_score: int | None = None
    # TestCompletion.score of the most recent non-baseline completion

    control_point_days: int | None = None
    # ClinicalRule.control_point_days for the patient's primary diagnosis

    response_threshold_pct: int | None = None
    # ClinicalRule.response_threshold_pct

    response_threshold_abs: int | None = None
    # ClinicalRule.response_threshold_abs

    improvement_direction: str | None = None
    # Scale.improvement_direction: "lower" | "higher"

    now: datetime | None = None
    # injectable for unit tests; defaults to datetime.now(timezone.utc)


def compute_card_color(inputs: ColorInputs) -> CardColor:
    now = inputs.now or datetime.now(timezone.utc)

    # Severe SEs always override other signals
    if any(s >= 3 for s in inputs.se_severities):
        return "red"

    sev1_count = sum(1 for s in inputs.se_severities if s == 1)
    has_sev2 = any(s == 2 for s in inputs.se_severities)

    # Moderate SE concerns override gray check
    if sev1_count > 3 or has_sev2:
        return "yellow"

    # No concerning SEs — check if there is enough clinical data
    if _is_gray(inputs, now):
        return "gray"

    dynamics = _clinical_dynamics(inputs, now)
    if dynamics == "negative":
        return "red"
    if dynamics == "not_reached":
        return "yellow"
    if dynamics == "positive" and sev1_count <= 3 and not has_sev2:
        return "green"
    return "gray"


def _is_gray(inputs: ColorInputs, now: datetime) -> bool:
    if inputs.therapy_start is None:
        return True
    therapy_start = inputs.therapy_start
    if therapy_start.tzinfo is None:
        therapy_start = therapy_start.replace(tzinfo=timezone.utc)
    days_in_therapy = (now - therapy_start).days
    if days_in_therapy < GRAY_THRESHOLD_DAYS:
        return True
    if inputs.baseline_score is None and inputs.latest_score is None:
        return True
    return False


def _clinical_dynamics(
    inputs: ColorInputs, now: datetime
) -> Literal["positive", "not_reached", "negative", "unknown"]:
    if any(
        v is None
        for v in [
            inputs.baseline_score,
            inputs.latest_score,
            inputs.control_point_days,
            inputs.therapy_start,
        ]
    ):
        return "unknown"

    therapy_start = inputs.therapy_start
    assert therapy_start is not None
    if therapy_start.tzinfo is None:
        therapy_start = therapy_start.replace(tzinfo=timezone.utc)
    days_in_therapy = (now - therapy_start).days

    assert inputs.control_point_days is not None
    if days_in_therapy < inputs.control_point_days:
        return "unknown"

    baseline = inputs.baseline_score
    latest = inputs.latest_score
    assert baseline is not None
    assert latest is not None

    if inputs.improvement_direction == "lower":
        delta_pts = baseline - latest
    else:
        delta_pts = latest - baseline

    if delta_pts < 0:
        return "negative"

    assert inputs.response_threshold_abs is not None
    assert inputs.response_threshold_pct is not None

    if delta_pts >= inputs.response_threshold_abs:
        return "positive"

    if baseline != 0:
        pct_change = delta_pts / baseline * 100
        if pct_change >= inputs.response_threshold_pct:
            return "positive"

    return "not_reached"
