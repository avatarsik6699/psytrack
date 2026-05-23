from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.scales.models import ClinicalRule, Scale
from app.seeders.base import BaseSeeder

_OPT_0_3 = [
    {"value": 0, "label": "Not at all", "label_ru": "Совсем нет"},
    {"value": 1, "label": "Several days", "label_ru": "Несколько дней"},
    {"value": 2, "label": "More than half the days", "label_ru": "Больше половины дней"},
    {"value": 3, "label": "Nearly every day", "label_ru": "Почти каждый день"},
]


class ScalesSeeder(BaseSeeder):
    name = "scales"
    description = "PHQ-9, GAD-7, YMRS reference scales with questions and clinical rules"

    SCALES_DATA: list[dict] = [
        {
            "code": "PHQ9",
            "name": "Patient Health Questionnaire-9",
            "name_ru": "Опросник здоровья пациента — 9",
            "score_min": 0,
            "score_max": 27,
            "improvement_direction": "lower",
            "domains_json": None,
            "questions_json": [
                {"id": 1, "text": "Little interest or pleasure in doing things", "text_ru": "Мало интереса или удовольствия от выполнения дел", "options": _OPT_0_3},
                {"id": 2, "text": "Feeling down, depressed, or hopeless", "text_ru": "Чувство подавленности, депрессии или безнадёжности", "options": _OPT_0_3},
                {"id": 3, "text": "Trouble falling or staying asleep, or sleeping too much", "text_ru": "Трудности с засыпанием, поддержанием сна или пересыпание", "options": _OPT_0_3},
                {"id": 4, "text": "Feeling tired or having little energy", "text_ru": "Чувство усталости или нехватки энергии", "options": _OPT_0_3},
                {"id": 5, "text": "Poor appetite or overeating", "text_ru": "Снижение аппетита или переедание", "options": _OPT_0_3},
                {"id": 6, "text": "Feeling bad about yourself — or that you are a failure or have let yourself or your family down", "text_ru": "Ощущение собственной никчёмности или чувство вины перед собой и близкими", "options": _OPT_0_3},
                {"id": 7, "text": "Trouble concentrating on things, such as reading the newspaper or watching television", "text_ru": "Затруднение концентрации на чём-либо, например при чтении или просмотре телевизора", "options": _OPT_0_3},
                {"id": 8, "text": "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual", "text_ru": "Замедленность движений и речи до такой степени, что другие могли замечать? Или, напротив, суетливость и беспокойство — вы двигались больше, чем обычно", "options": _OPT_0_3},
                {"id": 9, "text": "Thoughts that you would be better off dead, or of hurting yourself in some way", "text_ru": "Мысли о том, что лучше бы вы умерли, или желание причинить себе вред", "options": _OPT_0_3},
            ],
        },
        {
            "code": "GAD7",
            "name": "Generalized Anxiety Disorder-7",
            "name_ru": "Шкала генерализованного тревожного расстройства — 7",
            "score_min": 0,
            "score_max": 21,
            "improvement_direction": "lower",
            "domains_json": None,
            "questions_json": [
                {"id": 1, "text": "Feeling nervous, anxious, or on edge", "text_ru": "Ощущение нервозности, тревоги или напряжённости", "options": _OPT_0_3},
                {"id": 2, "text": "Not being able to stop or control worrying", "text_ru": "Неспособность остановить или контролировать беспокойство", "options": _OPT_0_3},
                {"id": 3, "text": "Worrying too much about different things", "text_ru": "Чрезмерное беспокойство по разным поводам", "options": _OPT_0_3},
                {"id": 4, "text": "Trouble relaxing", "text_ru": "Трудности с расслаблением", "options": _OPT_0_3},
                {"id": 5, "text": "Being so restless that it is hard to sit still", "text_ru": "Настолько сильное беспокойство, что трудно усидеть на месте", "options": _OPT_0_3},
                {"id": 6, "text": "Becoming easily annoyed or irritable", "text_ru": "Раздражительность или повышенная возбудимость", "options": _OPT_0_3},
                {"id": 7, "text": "Feeling afraid, as if something awful might happen", "text_ru": "Ощущение страха, как будто должно произойти что-то ужасное", "options": _OPT_0_3},
            ],
        },
        {
            "code": "YMRS",
            "name": "Young Mania Rating Scale",
            "name_ru": "Шкала мании Янга",
            "score_min": 0,
            "score_max": 60,
            "improvement_direction": "lower",
            "domains_json": None,
            "questions_json": [
                {
                    "id": 1,
                    "text": "Elevated mood",
                    "text_ru": "Повышенное настроение",
                    "options": [
                        {"value": 0, "label": "Absent", "label_ru": "Отсутствует"},
                        {"value": 1, "label": "Mildly or possibly increased on questioning", "label_ru": "Незначительно или возможно повышено при расспросе"},
                        {"value": 2, "label": "Definite subjective elevation; optimistic, self-confident; cheerful; appropriate to content", "label_ru": "Выраженное субъективное приподнятое настроение; оптимизм, уверенность; весёлость; соответствует содержанию"},
                        {"value": 3, "label": "Elevated, inappropriate to content; humorous", "label_ru": "Приподнятое, неадекватное содержанию; шутливое"},
                        {"value": 4, "label": "Euphoric; inappropriate laughter; singing", "label_ru": "Эйфория; неуместный смех; пение"},
                    ],
                },
                {
                    "id": 2,
                    "text": "Increased motor activity-energy",
                    "text_ru": "Повышенная двигательная активность и энергия",
                    "options": [
                        {"value": 0, "label": "Absent", "label_ru": "Отсутствует"},
                        {"value": 1, "label": "Subjectively increased", "label_ru": "Субъективно повышена"},
                        {"value": 2, "label": "Animated; gestures increased", "label_ru": "Оживлённость; усиление жестикуляции"},
                        {"value": 3, "label": "Excessive energy; hyperactive at times; restless (can be calmed)", "label_ru": "Чрезмерная энергия; временная гиперактивность; беспокойство (можно успокоить)"},
                        {"value": 4, "label": "Motor excitement; continuous hyperactivity (cannot be calmed)", "label_ru": "Двигательное возбуждение; непрерывная гиперактивность (невозможно успокоить)"},
                    ],
                },
                {
                    "id": 3,
                    "text": "Sexual interest",
                    "text_ru": "Сексуальный интерес",
                    "options": [
                        {"value": 0, "label": "Normal; not increased", "label_ru": "Нормальный; не повышен"},
                        {"value": 1, "label": "Mildly or possibly increased", "label_ru": "Незначительно или возможно повышен"},
                        {"value": 2, "label": "Definite subjective increase on questioning", "label_ru": "Выраженное субъективное усиление при расспросе"},
                        {"value": 3, "label": "Spontaneous sexual content; elaborates on sexual matters; hypersexual by self-report", "label_ru": "Спонтанное сексуальное содержание; детализация сексуальных тем; гиперсексуальность по самооценке"},
                        {"value": 4, "label": "Overt sexual acts (toward patients, staff, or interviewer)", "label_ru": "Явные сексуальные действия (в отношении пациентов, персонала или интервьюера)"},
                    ],
                },
                {
                    "id": 4,
                    "text": "Sleep",
                    "text_ru": "Сон",
                    "options": [
                        {"value": 0, "label": "Reports no decrease in sleep", "label_ru": "Не отмечает сокращения сна"},
                        {"value": 1, "label": "Sleeping less than normal amount by up to one hour", "label_ru": "Спит меньше обычного — до одного часа"},
                        {"value": 2, "label": "Sleeping less than normal by more than one hour", "label_ru": "Спит меньше обычного — более одного часа"},
                        {"value": 3, "label": "Reports decreased need for sleep", "label_ru": "Отмечает снижение потребности во сне"},
                        {"value": 4, "label": "Denies need for sleep", "label_ru": "Отрицает потребность во сне"},
                    ],
                },
                {
                    "id": 5,
                    "text": "Irritability",
                    "text_ru": "Раздражительность",
                    "options": [
                        {"value": 0, "label": "Absent", "label_ru": "Отсутствует"},
                        {"value": 2, "label": "Subjectively increased", "label_ru": "Субъективно повышена"},
                        {"value": 4, "label": "Irritable at times during interview; recent episodes of anger or annoyance on ward", "label_ru": "Временами раздражителен в ходе интервью; недавние вспышки гнева в отделении"},
                        {"value": 6, "label": "Frequently irritable during interview; short, curt throughout", "label_ru": "Часто раздражителен в ходе интервью; краткость, резкость на протяжении всего разговора"},
                        {"value": 8, "label": "Hostile, uncooperative; interview impossible", "label_ru": "Враждебен, не идёт на контакт; интервью невозможно"},
                    ],
                },
                {
                    "id": 6,
                    "text": "Speech (rate and amount)",
                    "text_ru": "Речь (темп и объём)",
                    "options": [
                        {"value": 0, "label": "No increase", "label_ru": "Не ускорена"},
                        {"value": 2, "label": "Feels talkative", "label_ru": "Ощущает себя болтливым"},
                        {"value": 4, "label": "Increased rate or amount at times, verbose at times", "label_ru": "Временами ускоренный темп или большой объём, многословность"},
                        {"value": 6, "label": "Push; consistently increased rate and amount; difficult to interrupt", "label_ru": "Напряжённость; постоянно ускоренный темп и большой объём; трудно перебить"},
                        {"value": 8, "label": "Pressured; uninterruptible, continuous speech", "label_ru": "Давление; непрерывная, невозможная к прерыванию речь"},
                    ],
                },
                {
                    "id": 7,
                    "text": "Language-thought disorder",
                    "text_ru": "Нарушения мышления и речи",
                    "options": [
                        {"value": 0, "label": "Absent", "label_ru": "Отсутствует"},
                        {"value": 1, "label": "Circumstantial; mild distractibility; quick thoughts", "label_ru": "Обстоятельность; лёгкая отвлекаемость; быстрые мысли"},
                        {"value": 2, "label": "Distractible; loses goal of thought; changes topics frequently; racing thoughts", "label_ru": "Отвлекаемость; потеря нити мысли; частая смена тем; скачка идей"},
                        {"value": 3, "label": "Flight of ideas; tangentiality; difficult to follow; rhyming; echolalia", "label_ru": "Бегство идей; тангенциальность; сложно следить; рифмование; эхолалия"},
                        {"value": 4, "label": "Incoherent; communication impossible", "label_ru": "Бессвязность; общение невозможно"},
                    ],
                },
                {
                    "id": 8,
                    "text": "Content",
                    "text_ru": "Содержание мышления",
                    "options": [
                        {"value": 0, "label": "Normal", "label_ru": "Нормальное"},
                        {"value": 2, "label": "Questionable plans, new interests", "label_ru": "Сомнительные планы, новые интересы"},
                        {"value": 4, "label": "Special project(s); hyperreligious", "label_ru": "Особые проекты; гиперрелигиозность"},
                        {"value": 6, "label": "Grandiose or paranoid ideas; ideas of reference", "label_ru": "Грандиозные или параноидные идеи; идеи отношения"},
                        {"value": 8, "label": "Delusions; hallucinations", "label_ru": "Бред; галлюцинации"},
                    ],
                },
                {
                    "id": 9,
                    "text": "Disruptive-aggressive behavior",
                    "text_ru": "Деструктивно-агрессивное поведение",
                    "options": [
                        {"value": 0, "label": "Absent, cooperative", "label_ru": "Отсутствует, контактен"},
                        {"value": 2, "label": "Sarcastic; loud at times, guarded", "label_ru": "Саркастичен; временами громкий, насторожённый"},
                        {"value": 4, "label": "Demanding; threats on ward", "label_ru": "Требователен; угрозы в отделении"},
                        {"value": 6, "label": "Threatens interviewer; shouting; interview difficult", "label_ru": "Угрозы в адрес интервьюера; крики; интервью затруднено"},
                        {"value": 8, "label": "Assaultive; destructive; interview impossible", "label_ru": "Нападает; разрушителен; интервью невозможно"},
                    ],
                },
                {
                    "id": 10,
                    "text": "Appearance",
                    "text_ru": "Внешний вид",
                    "options": [
                        {"value": 0, "label": "Appropriate dress and grooming", "label_ru": "Опрятный вид и одежда"},
                        {"value": 1, "label": "Minimally unkempt", "label_ru": "Слегка неопрятен"},
                        {"value": 2, "label": "Poorly groomed; moderately disheveled; overdressed", "label_ru": "Плохо ухожен; умеренно растрёпан; одет экстравагантно"},
                        {"value": 3, "label": "Disheveled; partly clothed; garish makeup", "label_ru": "Растрёпан; частично одет; вульгарный макияж"},
                        {"value": 4, "label": "Completely unkempt; decorated; bizarre garb", "label_ru": "Полностью неопрятен; украшен; причудливая одежда"},
                    ],
                },
                {
                    "id": 11,
                    "text": "Insight",
                    "text_ru": "Критика",
                    "options": [
                        {"value": 0, "label": "Present; admits illness; agrees with need for treatment", "label_ru": "Сохранена; признаёт болезнь; согласен с необходимостью лечения"},
                        {"value": 1, "label": "Possibly ill", "label_ru": "Возможно болен"},
                        {"value": 2, "label": "Admits behavior change, but denies illness", "label_ru": "Признаёт изменение поведения, но отрицает болезнь"},
                        {"value": 3, "label": "Admits possible change in behavior, but denies illness", "label_ru": "Допускает возможное изменение поведения, но отрицает болезнь"},
                        {"value": 4, "label": "Denies any behavior change", "label_ru": "Отрицает любые изменения в поведении"},
                    ],
                },
            ],
        },
    ]

    async def run(self, session: AsyncSession) -> int:
        insert_stmt = pg_insert(Scale).values(self.SCALES_DATA)
        stmt = insert_stmt.on_conflict_do_update(
            index_elements=["code"],
            set_={
                "name_ru": insert_stmt.excluded.name_ru,
                "questions_json": insert_stmt.excluded.questions_json,
            },
        )
        result = await session.execute(stmt)
        scales_upserted = result.rowcount
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
        return scales_upserted + rules_inserted
