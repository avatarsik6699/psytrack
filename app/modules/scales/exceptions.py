from fastapi import HTTPException


class ScaleNotFound(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=404, detail="Scale not found")


class PatientScaleNotFound(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=404, detail="Patient scale not found")
