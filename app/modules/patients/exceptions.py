from app.core.exceptions import AppException


class PatientNotFound(AppException):
    status_code = 404
    detail = "Patient not found"
