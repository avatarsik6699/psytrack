from app.core.exceptions import AppException


class DiagnosisNotFound(AppException):
    status_code = 404
    detail = "Diagnosis not found"
