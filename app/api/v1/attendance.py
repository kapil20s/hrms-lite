from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.db.database import get_db
from app.services.attendance import AttendanceService
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceBulkCreate,
    AttendanceResponse,
    AttendanceSummary,
    DashboardSummary,
)
from app.schemas.common import Envelope

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("", response_model=Envelope[list[AttendanceResponse]])
def list_attendance(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    date: Optional[date] = Query(None, description="Filter by specific date"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Filter by month"),
    year: Optional[int] = Query(None, ge=2020, le=2100, description="Filter by year"),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    records = service.get_all(
        employee_id=employee_id,
        attendance_date=date,
        month=month,
        year=year,
    )
    data = []
    for r in records:
        resp = AttendanceResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=r.employee.name if r.employee else None,
            date=r.date,
            status=r.status,
            created_at=str(r.created_at) if r.created_at else None,
        )
        data.append(resp)
    return Envelope(data=data, message=f"Found {len(data)} attendance record(s)")


@router.post("", response_model=Envelope[AttendanceResponse], status_code=status.HTTP_201_CREATED)
def create_attendance(data: AttendanceCreate, db: Session = Depends(get_db)):
    service = AttendanceService(db)
    record = service.create(data)
    resp = AttendanceResponse(
        id=record.id,
        employee_id=record.employee_id,
        employee_name=record.employee.name if record.employee else None,
        date=record.date,
        status=record.status,
        created_at=str(record.created_at) if record.created_at else None,
    )
    return Envelope(data=resp, message="Attendance marked successfully")


@router.post("/bulk", response_model=Envelope[list[AttendanceResponse]], status_code=status.HTTP_201_CREATED)
def bulk_create_attendance(data: AttendanceBulkCreate, db: Session = Depends(get_db)):
    service = AttendanceService(db)
    records = service.bulk_create(data)
    resp_list = []
    for r in records:
        resp = AttendanceResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=r.employee.name if r.employee else None,
            date=r.date,
            status=r.status,
            created_at=str(r.created_at) if r.created_at else None,
        )
        resp_list.append(resp)
    return Envelope(data=resp_list, message=f"Processed {len(resp_list)} attendance record(s)")


@router.put("/{attendance_id}", response_model=Envelope[AttendanceResponse])
def update_attendance(attendance_id: int, data: AttendanceUpdate, db: Session = Depends(get_db)):
    service = AttendanceService(db)
    record = service.update(attendance_id, data)
    resp = AttendanceResponse(
        id=record.id,
        employee_id=record.employee_id,
        employee_name=record.employee.name if record.employee else None,
        date=record.date,
        status=record.status,
        created_at=str(record.created_at) if record.created_at else None,
    )
    return Envelope(data=resp, message="Attendance updated successfully")


@router.get("/summary", response_model=Envelope[list[AttendanceSummary]])
def get_attendance_summary(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    summaries = service.get_summary(employee_id=employee_id)
    return Envelope(data=summaries, message=f"Found {len(summaries)} summary record(s)")


@router.get("/dashboard", response_model=Envelope[DashboardSummary])
def get_dashboard_summary(db: Session = Depends(get_db)):
    service = AttendanceService(db)
    summary = service.get_dashboard_summary()
    return Envelope(data=summary, message="Dashboard summary retrieved")
