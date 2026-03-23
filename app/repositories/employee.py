"""Data access layer for Employee model."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.employee import Employee


class EmployeeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_all(
        self,
        department: Optional[str] = None,
        search: Optional[str] = None,
    ) -> list[Employee]:
        stmt = select(Employee)
        if department:
            stmt = stmt.where(Employee.department == department)
        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                (Employee.name.ilike(search_term))
                | (Employee.email.ilike(search_term))
            )
        stmt = stmt.order_by(Employee.created_at.desc())
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def get_by_id(self, employee_id: int) -> Optional[Employee]:
        stmt = select(Employee).where(Employee.id == employee_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_email(self, email: str) -> Optional[Employee]:
        stmt = select(Employee).where(Employee.email == email)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_employee_id(self, employee_id: str) -> Optional[Employee]:
        """Find employee by their string employee_id (not DB primary key)."""
        stmt = select(Employee).where(Employee.employee_id == employee_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def create(self, employee: Employee) -> Employee:
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def update(self, employee: Employee) -> Employee:
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def delete(self, employee: Employee) -> None:
        self.db.delete(employee)
        self.db.commit()

    def count(self) -> int:
        stmt = select(Employee)
        result = self.db.execute(stmt)
        return len(list(result.scalars().all()))

    def get_departments(self) -> list[str]:
        stmt = select(Employee.department).distinct()
        result = self.db.execute(stmt)
        return list(result.scalars().all())
