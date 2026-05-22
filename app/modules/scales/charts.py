from uuid import UUID

from app.modules.scales.models import TestCompletion
from app.modules.scales.repository import TestCompletionRepository
from app.modules.scales.schemas import ScoreChartPoint, ScoreChartSeries


def _build_series(completions: list[TestCompletion]) -> list[ScoreChartSeries]:
    by_scale: dict[str, list[TestCompletion]] = {}
    for tc in completions:
        key = str(tc.scale_id)
        if key not in by_scale:
            by_scale[key] = []
        by_scale[key].append(tc)

    result: list[ScoreChartSeries] = []
    for tcs in by_scale.values():
        scale = tcs[0].scale
        result.append(
            ScoreChartSeries(
                scale_id=scale.id,
                scale_code=scale.code,
                scale_name=scale.name,
                score_min=scale.score_min,
                score_max=scale.score_max,
                improvement_direction=scale.improvement_direction,
                points=[
                    ScoreChartPoint(
                        completed_at=tc.completed_at,
                        score=tc.score,
                        baseline=tc.baseline,
                    )
                    for tc in tcs
                ],
            )
        )
    return result


class ScoreChartService:
    def __init__(self, tc_repo: TestCompletionRepository) -> None:
        self._tc_repo = tc_repo

    async def get_series(self, patient_id: UUID) -> list[ScoreChartSeries]:
        completions = await self._tc_repo.list_all_by_patient(patient_id)
        return _build_series(completions)
