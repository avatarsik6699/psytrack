from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.medications.models import MedicationReference
from app.seeders.base import BaseSeeder


class MedicationReferenceSeeder(BaseSeeder):
    name = "medications_reference"
    description = "Psychiatric medication reference data (INN + brand names)"

    SEED_DATA: list[dict] = [
        {"inn": "sertraline",    "brand_names": ["Zoloft"]},
        {"inn": "fluoxetine",    "brand_names": ["Prozac"]},
        {"inn": "escitalopram",  "brand_names": ["Lexapro", "Cipralex"]},
        {"inn": "quetiapine",    "brand_names": ["Seroquel"]},
        {"inn": "lithium",       "brand_names": ["Lithobid", "Eskalith"]},
        {"inn": "clonazepam",    "brand_names": ["Klonopin"]},
        {"inn": "aripiprazole",  "brand_names": ["Abilify"]},
        {"inn": "olanzapine",    "brand_names": ["Zyprexa"]},
    ]

    async def run(self, session: AsyncSession) -> int:
        stmt = (
            pg_insert(MedicationReference)
            .values(self.SEED_DATA)
            .on_conflict_do_nothing(index_elements=["inn"])
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount
