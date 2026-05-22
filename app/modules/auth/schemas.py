from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    consent_152fz: Literal[True]


class PatientTempLoginRequest(BaseModel):
    temp_login: str
    password: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class AccountDeletionResponse(BaseModel):
    deleted: bool


class EmailUpdateIn(BaseModel):
    email: EmailStr
