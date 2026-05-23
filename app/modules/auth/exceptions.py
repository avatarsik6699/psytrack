from app.core.exceptions import AppException


class NotAuthenticated(AppException):
    status_code = 401
    detail = "Not authenticated"
    headers = {"WWW-Authenticate": "Bearer"}


class InvalidCredentials(AppException):
    status_code = 401
    detail = "Invalid login or password"
    headers = {"WWW-Authenticate": "Bearer"}


class LoginUnavailable(AppException):
    status_code = 409
    detail = "Login is unavailable"


class InvalidToken(AppException):
    status_code = 401
    detail = "Invalid or expired token"
    headers = {"WWW-Authenticate": "Bearer"}


class AccountDisabled(AppException):
    status_code = 403
    detail = "Account is disabled"


class InsufficientRole(AppException):
    status_code = 403
    detail = "Insufficient permissions"
