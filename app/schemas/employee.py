"""Pydantic v2 schemas for Employee endpoints."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class EmployeeCreate(BaseModel):
    """Schema for creating a new employee."""

    employee_id: str = Field(
        ..., min_length=1, max_length=50, description="Unique employee identifier"
    )
    name: str = Field(
        ..., min_length=1, max_length=100, description="Employee full name"
    )
    email: EmailStr = Field(..., description="Employee email address")
    department: str = Field(
        ..., min_length=1, max_length=100, description="Department name"
    )

    @field_validator("employee_id")
    @classmethod
    def strip_employee_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("employee_id must not be blank")
        return v

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be blank")
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("department")
    @classmethod
    def strip_department(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("department must not be blank")
        return v


class EmployeeUpdate(BaseModel):
    """Schema for updating an existing employee."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    department: Optional[str] = Field(None, min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip().lower()
        return v


class EmployeeResponse(BaseModel):
    """Schema for employee API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: str
    name: str
    email: str
    department: str
    created_at: datetime
    updated_at: datetime
