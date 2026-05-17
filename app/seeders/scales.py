from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.scales.models import ClinicalRule, Scale
from app.seeders.base import BaseSeeder

_OPT_0_3 = [
    {"value": 0, "label": "Not at all"},
    {"value": 1, "label": "Several days"},
    {"value": 2, "label": "More than half the days"},
    {"value": 3, "label": "Nearly every day"},
]


class ScalesSeeder(BaseSeeder):
    name = "scales"
    description = "PHQ-9, GAD-7, YMRS reference scales with questions and clinical rules"

    SCALES_DATA: list[dict] = [
        {
            "code": "PHQ9",
            "name": "Patient Health Questionnaire-9",
            "score_min": 0,
            "score_max": 27,
            "improvement_direction": "lower",
            "domains_json": None,
            "questions_json": [
                {"id": 1, "text": "Little interest or pleasure in doing things", "options": _OPT_0_3},
                {"id": 2, "text": "Feeling down, depressed, or hopeless", "options": _OPT_0_3},
                {"id": 3, "text": "Trouble falling or staying asleep, or sleeping too much", "options": _OPT_0_3},
                {"id": 4, "text": "Feeling tired or having little energy", "options": _OPT_0_3},
                {"id": 5, "text": "Poor appetite or overeating", "options": _OPT_0_3},
                {"id": 6, "text": "Feeling bad about yourself — or that you are a failure or have let yourself or your family down", "options": _OPT_0_3},
                {"id": 7, "text": "Trouble concentrating on things, such as reading the newspaper or watching television", "options": _OPT_0_3},
                {"id": 8, "text": "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual", "options": _OPT_0_3},
                {"id": 9, "text": "Thoughts that you would be better off dead, or of hurting yourself in some way", "options": _OPT_0_3},
            ],
        },
        {
            "code": "GAD7",
            "name": "Generalized Anxiety Disorder-7",
            "score_min": 0,
            "score_max": 21,
            "improvement_direction": "lower",
            "domains_json": None,
            "questions_json": [
                {"id": 1, "text": "Feeling nervous, anxious, or on edge", "options": _OPT_0_3},
                {"id": 2, "text": "Not being able to stop or control worrying", "options": _OPT_0_3},
                {"id": 3, "text": "Worrying too much about different things", "options": _OPT_0_3},
                {"id": 4, "text": "Trouble relaxing", "options": _OPT_0_3},
                {"id": 5, "text": "Being so restless that it is hard to sit still", "options": _OPT_0_3},
                {"id": 6, "text": "Becoming easily annoyed or irritable", "options": _OPT_0_3},
                {"id": 7, "text": "Feeling afraid, as if something awful might happen", "options": _OPT_0_3},
            ],
        },
        {
            "code": "YMRS",
            "name": "Young Mania Rating Scale",
            "score_min": 0,
            "score_max": 60,
            "improvement_direction": "lower",
            "domains_json": None,
            "questions_json": [
                {
                    "id": 1,
                    "text": "Elevated mood",
                    "options": [
                        {"value": 0, "label": "Absent"},
                        {"value": 1, "label": "Mildly or possibly increased on questioning"},
                        {"value": 2, "label": "Definite subjective elevation; optimistic, self-confident; cheerful; appropriate to content"},
                        {"value": 3, "label": "Elevated, inappropriate to content; humorous"},
                        {"value": 4, "label": "Euphoric; inappropriate laughter; singing"},
                    ],
                },
                {
                    "id": 2,
                    "text": "Increased motor activity-energy",
                    "options": [
                        {"value": 0, "label": "Absent"},
                        {"value": 1, "label": "Subjectively increased"},
                        {"value": 2, "label": "Animated; gestures increased"},
                        {"value": 3, "label": "Excessive energy; hyperactive at times; restless (can be calmed)"},
                        {"value": 4, "label": "Motor excitement; continuous hyperactivity (cannot be calmed)"},
                    ],
                },
                {
                    "id": 3,
                    "text": "Sexual interest",
                    "options": [
                        {"value": 0, "label": "Normal; not increased"},
                        {"value": 1, "label": "Mildly or possibly increased"},
                        {"value": 2, "label": "Definite subjective increase on questioning"},
                        {"value": 3, "label": "Spontaneous sexual content; elaborates on sexual matters; hypersexual by self-report"},
                        {"value": 4, "label": "Overt sexual acts (toward patients, staff, or interviewer)"},
                    ],
                },
                {
                    "id": 4,
                    "text": "Sleep",
                    "options": [
                        {"value": 0, "label": "Reports no decrease in sleep"},
                        {"value": 1, "label": "Sleeping less than normal amount by up to one hour"},
                        {"value": 2, "label": "Sleeping less than normal by more than one hour"},
                        {"value": 3, "label": "Reports decreased need for sleep"},
                        {"value": 4, "label": "Denies need for sleep"},
                    ],
                },
                {
                    "id": 5,
                    "text": "Irritability",
                    "options": [
                        {"value": 0, "label": "Absent"},
                        {"value": 2, "label": "Subjectively increased"},
                        {"value": 4, "label": "Irritable at times during interview; recent episodes of anger or annoyance on ward"},
                        {"value": 6, "label": "Frequently irritable during interview; short, curt throughout"},
                        {"value": 8, "label": "Hostile, uncooperative; interview impossible"},
                    ],
                },
                {
                    "id": 6,
                    "text": "Speech (rate and amount)",
                    "options": [
                        {"value": 0, "label": "No increase"},
                        {"value": 2, "label": "Feels talkative"},
                        {"value": 4, "label": "Increased rate or amount at times, verbose at times"},
                        {"value": 6, "label": "Push; consistently increased rate and amount; difficult to interrupt"},
                        {"value": 8, "label": "Pressured; uninterruptible, continuous speech"},
                    ],
                },
                {
                    "id": 7,
                    "text": "Language-thought disorder",
                    "options": [
                        {"value": 0, "label": "Absent"},
                        {"value": 1, "label": "Circumstantial; mild distractibility; quick thoughts"},
                        {"value": 2, "label": "Distractible; loses goal of thought; changes topics frequently; racing thoughts"},
                        {"value": 3, "label": "Flight of ideas; tangentiality; difficult to follow; rhyming; echolalia"},
                        {"value": 4, "label": "Incoherent; communication impossible"},
                    ],
                },
                {
                    "id": 8,
                    "text": "Content",
                    "options": [
                        {"value": 0, "label": "Normal"},
                        {"value": 2, "label": "Questionable plans, new interests"},
                        {"value": 4, "label": "Special project(s); hyperreligious"},
                        {"value": 6, "label": "Grandiose or paranoid ideas; ideas of reference"},
                        {"value": 8, "label": "Delusions; hallucinations"},
                    ],
                },
                {
                    "id": 9,
                    "text": "Disruptive-aggressive behavior",
                    "options": [
                        {"value": 0, "label": "Absent, cooperative"},
                        {"value": 2, "label": "Sarcastic; loud at times, guarded"},
                        {"value": 4, "label": "Demanding; threats on ward"},
                        {"value": 6, "label": "Threatens interviewer; shouting; interview difficult"},
                        {"value": 8, "label": "Assaultive; destructive; interview impossible"},
                    ],
                },
                {
                    "id": 10,
                    "text": "Appearance",
                    "options": [
                        {"value": 0, "label": "Appropriate dress and grooming"},
                        {"value": 1, "label": "Minimally unkempt"},
                        {"value": 2, "label": "Poorly groomed; moderately disheveled; overdressed"},
                        {"value": 3, "label": "Disheveled; partly clothed; garish makeup"},
                        {"value": 4, "label": "Completely unkempt; decorated; bizarre garb"},
                    ],
                },
                {
                    "id": 11,
                    "text": "Insight",
                    "options": [
                        {"value": 0, "label": "Present; admits illness; agrees with need for treatment"},
                        {"value": 1, "label": "Possibly ill"},
                        {"value": 2, "label": "Admits behavior change, but denies illness"},
                        {"value": 3, "label": "Admits possible change in behavior, but denies illness"},
                        {"value": 4, "label": "Denies any behavior change"},
                    ],
                },
            ],
        },
    ]

    async def run(self, session: AsyncSession) -> int:
        stmt = pg_insert(Scale).values(self.SCALES_DATA).on_conflict_do_nothing(index_elements=["code"])
        result = await session.execute(stmt)
        scales_inserted = result.rowcount
        await session.flush()

        rows = await session.scalars(select(Scale).where(Scale.code.in_(["PHQ9", "GAD7", "YMRS"])))
        scale_map = {s.code: s.id for s in rows}

        rules_count = await session.scalar(select(func.count()).select_from(ClinicalRule))
        rules_inserted = 0
        if rules_count == 0:
            rules_data = [
                {
                    "diagnosis_icd": "F32",
                    "scale_id": scale_map["PHQ9"],
                    "control_point_days": 42,
                    "response_threshold_pct": 50,
                    "response_threshold_abs": 5,
                },
                {
                    "diagnosis_icd": "F41",
                    "scale_id": scale_map["GAD7"],
                    "control_point_days": 42,
                    "response_threshold_pct": 50,
                    "response_threshold_abs": 5,
                },
                {
                    "diagnosis_icd": "F30",
                    "scale_id": scale_map["YMRS"],
                    "control_point_days": 42,
                    "response_threshold_pct": 50,
                    "response_threshold_abs": 10,
                },
            ]
            rules_result = await session.execute(pg_insert(ClinicalRule).values(rules_data))
            rules_inserted = rules_result.rowcount

        await session.commit()
        return scales_inserted + rules_inserted
