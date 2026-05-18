from app.seeders.base import BaseSeeder
from app.seeders.medications import MedicationReferenceSeeder
from app.seeders.scales import ScalesSeeder
from app.seeders.side_effects import SideEffectsSeeder

# Registration order = execution order.
# To add a new seeder: create the class, import it here, append to the list.
ALL_SEEDERS: list[type[BaseSeeder]] = [
    MedicationReferenceSeeder,
    ScalesSeeder,
    SideEffectsSeeder,
]

__all__ = ["ALL_SEEDERS", "BaseSeeder"]
