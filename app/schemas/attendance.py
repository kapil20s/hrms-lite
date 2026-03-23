from __future__ import annotations

from pydantic import BaseModel, Field
from datetime import date as DateType
from typing import Optional
from enum import Enum


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"


class AttendanceCreate(BaseModel):
    employee_id: int = Field(..., description="Employee ID")
    date: DateType = Field(..., description="Attendance date (YYYY-MM-DD)")
    status: AttendanceStatus = Field(..., description="Attendance status")


class AttendanceUpdate(BaseModel):
    status: AttendanceStatus = Field(..., description="Updated attendance status")


class AttendanceBulkCreate(BaseModel):
    date: DateType = Field(..., description="Attendance date")
    records: list[AttendanceRecord] = Field(..., description="List of attendance records")


class AttendanceRecord(BaseModel):
    employee_id: int
    status: AttendanceStatus


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    date: DateType
    status: str
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class AttendanceSummary(BaseModel):
    employee_id: int
    employee_name: str
    employee_department: str = ""
    total_present: int
    total_absent: int
    total_days: int
    attendance_percentage: float = 0.0


class DepartmentBreakdown(BaseModel):
    department: str
    total: int
    present: int
    absent: int
    unmarked: int


class DashboardSummary(BaseModel):
    total_employees: int
    department_count: int
    today_present: int
    today_absent: int
    today_unmarked: int
    department_breakdown: list[DepartmentBreakdown]
