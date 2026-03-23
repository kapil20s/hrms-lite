from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import date
from typing import Optional
from app.repositories.attendance import AttendanceRepository
from app.repositories.employee import EmployeeRepository
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceBulkCreate, AttendanceSummary, DashboardSummary, DepartmentBreakdown


class AttendanceService:
    def __init__(self, db: Session):
        self.repo = AttendanceRepository(db)
        self.employee_repo = EmployeeRepository(db)

    def get_all(
        self,
        employee_id: Optional[int] = None,
        attendance_date: Optional[date] = None,
        month: Optional[int] = None,
        year: Optional[int] = None,
    ) -> list[Attendance]:
        records = self.repo.get_all(
            employee_id=employee_id,
            attendance_date=attendance_date,
            month=month,
            year=year,
        )
        return records

    def create(self, data: AttendanceCreate) -> Attendance:
        # Verify employee exists
        employee = self.employee_repo.get_by_id(data.employee_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "EMPLOYEE_NOT_FOUND", "message": f"Employee with id {data.employee_id} not found"},
            )

        # Check for duplicate
        existing = self.repo.get_by_employee_and_date(data.employee_id, data.date)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_ATTENDANCE",
                    "message": f"Attendance already marked for this employee on {data.date}",
                    "details": {"employee_id": data.employee_id, "date": str(data.date)},
                },
            )

        attendance = Attendance(
            employee_id=data.employee_id,
            date=data.date,
            status=data.status.value,
        )
        return self.repo.create(attendance)

    def bulk_create(self, data: AttendanceBulkCreate) -> list[Attendance]:
        created = []
        skipped = []
        for record in data.records:
            # Verify employee exists
            employee = self.employee_repo.get_by_id(record.employee_id)
            if not employee:
                skipped.append({"employee_id": record.employee_id, "reason": "Employee not found"})
                continue

            existing = self.repo.get_by_employee_and_date(record.employee_id, data.date)
            if existing:
                # Update existing record
                existing.status = record.status.value
                self.repo.update(existing)
                created.append(existing)
            else:
                attendance = Attendance(
                    employee_id=record.employee_id,
                    date=data.date,
                    status=record.status.value,
                )
                created.append(self.repo.create(attendance))
        return created

    def update(self, attendance_id: int, data: AttendanceUpdate) -> Attendance:
        attendance = self.repo.get_by_id(attendance_id)
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ATTENDANCE_NOT_FOUND", "message": f"Attendance record with id {attendance_id} not found"},
            )
        attendance.status = data.status.value
        return self.repo.update(attendance)

    def get_summary(self, employee_id: Optional[int] = None) -> list[AttendanceSummary]:
        rows = self.repo.get_summary(employee_id=employee_id)
        summaries = []
        for row in rows:
            total_days = row["total_days"]
            total_present = row["total_present"]
            percentage = round((total_present / total_days) * 100, 1) if total_days > 0 else 0.0
            summaries.append(AttendanceSummary(
                employee_id=row["employee_id"],
                employee_name=row["employee_name"],
                employee_department=row.get("employee_department", ""),
                total_present=total_present,
                total_absent=row["total_absent"],
                total_days=total_days,
                attendance_percentage=percentage,
            ))
        return summaries

    def get_dashboard_summary(self) -> DashboardSummary:
        today = date.today()
        total_employees = self.employee_repo.count()
        today_stats = self.repo.get_today_stats(today)

        today_present = today_stats["present"]
        today_absent = today_stats["absent"]
        today_unmarked = total_employees - today_present - today_absent

        # Department breakdown with per-dept attendance
        departments = self.employee_repo.get_departments()
        dept_breakdown = []
        for dept in departments:
            dept_employees = self.employee_repo.get_all(department=dept)
            dept_total = len(dept_employees)
            dept_employee_ids = [e.id for e in dept_employees]
            dept_today_stats = self.repo.get_dept_today_stats(today, dept_employee_ids)
            dept_present = dept_today_stats["present"]
            dept_absent = dept_today_stats["absent"]
            dept_unmarked = dept_total - dept_present - dept_absent
            dept_breakdown.append(DepartmentBreakdown(
                department=dept,
                total=dept_total,
                present=dept_present,
                absent=dept_absent,
                unmarked=dept_unmarked,
            ))

        return DashboardSummary(
            total_employees=total_employees,
            department_count=len(departments),
            today_present=today_present,
            today_absent=today_absent,
            today_unmarked=today_unmarked,
            department_breakdown=dept_breakdown,
        )
