from fastapi import HTTPException


class SeDictionaryEntryNotFound(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=404, detail="SE dictionary entry not found")


class PatientSideEffectNotFound(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=404, detail="Patient side effect not found")


class SeMonitoringRuleNotFound(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=404, detail="SE monitoring rule not found")
