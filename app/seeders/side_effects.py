from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.side_effects.models import SeDictionary
from app.seeders.base import BaseSeeder


class SideEffectsSeeder(BaseSeeder):
    name = "side_effects"
    description = "UKU side-effect dictionary (bilingual RU/EN, 48 items)"

    SEED_DATA: list[dict] = [
        # ── Psychic symptoms ─────────────────────────────────────────────────
        {"uku_code": "1.1", "name_ru": "Концентрация/Память", "name_en": "Concentration/Memory", "body_system": "psychic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "1.2", "name_ru": "Астения/Вялость/Усиление утомляемости", "name_en": "Asthenia/Lassitude/Increased Fatigability", "body_system": "psychic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "1.3", "name_ru": "Сонливость/Седация", "name_en": "Drowsiness/Sedation", "body_system": "psychic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "1.4", "name_ru": "Нарушение памяти", "name_en": "Failing Memory", "body_system": "psychic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "1.5", "name_ru": "Депрессия", "name_en": "Depression", "body_system": "psychic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "1.6", "name_ru": "Напряжённость/Внутреннее беспокойство", "name_en": "Tension/Inner Unrest", "body_system": "psychic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "1.7", "name_ru": "Снижение продолжительности сна", "name_en": "Reduced Duration of Sleep", "body_system": "psychic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "1.8", "name_ru": "Увеличение продолжительности сна", "name_en": "Increased Duration of Sleep", "body_system": "psychic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "1.9", "name_ru": "Нарушение засыпания и поддержания сна", "name_en": "Increased Dream Activity", "body_system": "psychic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "1.10", "name_ru": "Эмоциональная индифферентность", "name_en": "Emotional Indifference", "body_system": "psychic", "severity_min": 0, "severity_max": 3},
        # ── Neurological symptoms ─────────────────────────────────────────────
        {"uku_code": "2.1", "name_ru": "Дистония", "name_en": "Dystonia", "body_system": "neurological", "severity_min": 0, "severity_max": 3},
        {"uku_code": "2.2", "name_ru": "Ригидность", "name_en": "Rigidity", "body_system": "neurological", "severity_min": 0, "severity_max": 3},
        {"uku_code": "2.3", "name_ru": "Гипокинезия/Акинезия", "name_en": "Hypokinesia/Akinesia", "body_system": "neurological", "severity_min": 0, "severity_max": 3},
        {"uku_code": "2.4", "name_ru": "Гиперкинезия", "name_en": "Hyperkinesia", "body_system": "neurological", "severity_min": 0, "severity_max": 3},
        {"uku_code": "2.5", "name_ru": "Тремор", "name_en": "Tremor", "body_system": "neurological", "severity_min": 0, "severity_max": 3},
        {"uku_code": "2.6", "name_ru": "Акатизия", "name_en": "Akathisia", "body_system": "neurological", "severity_min": 0, "severity_max": 3},
        {"uku_code": "2.7", "name_ru": "Эпилептические припадки", "name_en": "Epileptic Seizures", "body_system": "neurological", "severity_min": 0, "severity_max": 3},
        {"uku_code": "2.8", "name_ru": "Парестезии/Онемение", "name_en": "Paresthesias/Numbness", "body_system": "neurological", "severity_min": 0, "severity_max": 3},
        # ── Autonomic symptoms ────────────────────────────────────────────────
        {"uku_code": "3.1", "name_ru": "Аккомодация", "name_en": "Accommodation", "body_system": "autonomic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "3.2", "name_ru": "Нарушение слюноотделения — усиление", "name_en": "Increased Salivation", "body_system": "autonomic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "3.3", "name_ru": "Нарушение слюноотделения — уменьшение", "name_en": "Reduced Salivation", "body_system": "autonomic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "3.4", "name_ru": "Тошнота/Рвота", "name_en": "Nausea/Vomiting", "body_system": "autonomic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "3.5", "name_ru": "Диарея", "name_en": "Diarrhea", "body_system": "autonomic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "3.6", "name_ru": "Запор", "name_en": "Constipation", "body_system": "autonomic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "3.7", "name_ru": "Нарушения мочеиспускания", "name_en": "Micturition Disturbances", "body_system": "autonomic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "3.8", "name_ru": "Ортостатический головокружение", "name_en": "Orthostatic Dizziness", "body_system": "autonomic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "3.9", "name_ru": "Сердцебиение/Тахикардия", "name_en": "Palpitations/Tachycardia", "body_system": "autonomic", "severity_min": 0, "severity_max": 3},
        {"uku_code": "3.10", "name_ru": "Повышенное потоотделение", "name_en": "Increased Perspiration", "body_system": "autonomic", "severity_min": 0, "severity_max": 3},
        # ── Other symptoms ────────────────────────────────────────────────────
        {"uku_code": "4.1", "name_ru": "Зуд/Сыпь", "name_en": "Pruritus/Rash", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.2", "name_ru": "Высыпания на солнце", "name_en": "Sunburn", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.3", "name_ru": "Увеличение массы тела", "name_en": "Weight Gain", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.4", "name_ru": "Уменьшение массы тела", "name_en": "Weight Loss", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.5", "name_ru": "Меноррагия", "name_en": "Menorrhagia", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.6", "name_ru": "Аменорея/Нарушение менструального цикла", "name_en": "Amenorrhea/Irregular Menstruation", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.7", "name_ru": "Изменение либидо", "name_en": "Increased/Decreased Libido", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.8", "name_ru": "Эректильная дисфункция", "name_en": "Erectile Dysfunction", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.9", "name_ru": "Эякуляторные нарушения", "name_en": "Ejaculatory Dysfunction", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.10", "name_ru": "Оргастические нарушения", "name_en": "Orgastic Dysfunction", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.11", "name_ru": "Гинекомастия/Галакторея", "name_en": "Gynaecomastia/Galactorrhoea", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.12", "name_ru": "Головная боль", "name_en": "Headache", "body_system": "other", "severity_min": 0, "severity_max": 3},
        {"uku_code": "4.13", "name_ru": "Слабость", "name_en": "Asthenia", "body_system": "other", "severity_min": 0, "severity_max": 3},
        # ── Tardive dyskinesia ────────────────────────────────────────────────
        {"uku_code": "5.1", "name_ru": "Поздняя дискинезия — лицо", "name_en": "Tardive Dyskinesia — Face", "body_system": "tardive", "severity_min": 0, "severity_max": 3},
        {"uku_code": "5.2", "name_ru": "Поздняя дискинезия — шея/туловище", "name_en": "Tardive Dyskinesia — Neck/Trunk", "body_system": "tardive", "severity_min": 0, "severity_max": 3},
        {"uku_code": "5.3", "name_ru": "Поздняя дискинезия — конечности", "name_en": "Tardive Dyskinesia — Extremities", "body_system": "tardive", "severity_min": 0, "severity_max": 3},
        # ── Global assessment ─────────────────────────────────────────────────
        {"uku_code": "6.1", "name_ru": "Субъективный дискомфорт (пациент)", "name_en": "Subjective Distress (patient)", "body_system": "global", "severity_min": 0, "severity_max": 3},
        {"uku_code": "6.2", "name_ru": "Влияние на повседневную активность", "name_en": "Effect on Daily Activities", "body_system": "global", "severity_min": 0, "severity_max": 3},
        {"uku_code": "6.3", "name_ru": "Клиническая оценка тяжести", "name_en": "Clinical Assessment of Severity", "body_system": "global", "severity_min": 0, "severity_max": 3},
        {"uku_code": "6.4", "name_ru": "Общая оценка побочного действия", "name_en": "Overall Side-Effect Assessment", "body_system": "global", "severity_min": 0, "severity_max": 4},
    ]

    async def run(self, session: AsyncSession) -> int:
        stmt = (
            pg_insert(SeDictionary)
            .values(self.SEED_DATA)
            .on_conflict_do_nothing(index_elements=["uku_code"])
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount
