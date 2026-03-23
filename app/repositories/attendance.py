from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, case
from typing import Optional
from datetime import date
from app.models.attendance import Attendance
from app.models.employee import Employee


class AttendanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        employee_id: Optional[int] = None,
        attendance_date: Optional[date] = None,
        month: Optional[int] = None,
        year: Optional[int] = None,
    ) -> list[Attendance]:
        stmt = select(Attendance).join(Employee)
        if employee_id:
            stmt = stmt.where(Attendance.employee_id == employee_id)
        if attendance_date:
            stmt = stmt.where(Attendance.date == attendance_date)
        if month and year:
            stmt = stmt.where(
                and_(
                    func.extract("month", Attendance.date) == month,
                    func.extract("year", Attendance.date) == year,
                )
            )
        elif year:
            stmt = stmt.where(func.extract("year", Attendance.date) == year)
        stmt = stmt.order_by(Attendance.date.desc(), Employee.name)
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def get_by_id(self, attendance_id: int) -> Optional[Attendance]:
        stmt = select(Attendance).where(Attendance.id == attendance_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_employee_and_date(self, employee_id: int, attendance_date: date) -> Optional[Attendance]:
        stmt = select(Attendance).where(
            and_(
                Attendance.employee_id == employee_id,
                Attendance.date == attendance_date,
            )
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def create(self, attendance: Attendance) -> Attendance:
        self.db.add(attendance)
        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def bulk_create(self, records: list[Attendance]) -> list[Attendance]:
        self.db.add_all(records)
        self.db.commit()
        for record in records:
            self.db.refresh(record)
        return records

    def update(self, attendance: Attendance) -> Attendance:
        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def get_summary(self, employee_id: Optional[int] = None) -> list[dict]:
        stmt = (
            select(
                Attendance.employee_id,
                Employee.name.label("employee_name"),
                Employee.department.label("employee_department"),
                func.count().label("total_days"),
                func.sum(case((Attendance.status == "present", 1), else_=0)).label("total_present"),
                func.sum(case((Attendance.status == "absent", 1), else_=0)).label("total_absent"),
            )
            .join(Employee)
            .group_by(Attendance.employee_id, Employee.name, Employee.department)
        )
        if employee_id:
            stmt = stmt.where(Attendance.employee_id == employee_id)
        result = self.db.execute(stmt)
        return [
            {
                "employee_id": row.employee_id,
                "employee_name": row.employee_name,
                "employee_department": row.employee_department,
                "total_days": row.total_days,
                "total_present": row.total_present,
                "total_absent": row.total_absent,
            }
            for row in result.all()
        ]

    def get_today_stats(self, today: date) -> dict:
        stmt = (
            select(
                func.count().label("total"),
                func.sum(case((Attendance.status == "present", 1), else_=0)).label("present"),
                func.sum(case((Attendance.status == "absent", 1), else_=0)).label("absent"),
            )
            .where(Attendance.date == today)
        )
        result = self.db.execute(stmt).one()
        return {
            "total": result.total or 0,
            "present": result.present or 0,
            "absent": result.absent or 0,
        }

    def get_dept_today_stats(self, today: date, employee_ids: list[int]) -> dict:
        if not employee_ids:
            return {"present": 0, "absent": 0}
        stmt = (
            select(
                func.sum(case((Attendance.status == "present", 1), else_=0)).label("present"),
                func.sum(case((Attendance.status == "absent", 1), else_=0)).label("absent"),
            )
            .where(
                and_(
                    Attendance.date == today,
                    Attendance.employee_id.in_(employee_ids),
                )
            )
        )
        result = self.db.execute(stmt).one()
        return {
            "present": result.present or 0,
            "absent": result.absent or 0,
        }
