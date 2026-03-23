"""Business logic for Employee operations."""

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.repositories.employee import EmployeeRepository
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


class EmployeeService:
    def __init__(self, db: Session) -> None:
        self.repo = EmployeeRepository(db)

    def get_all(
        self,
        department: Optional[str] = None,
        search: Optional[str] = None,
    ) -> list[Employee]:
        return self.repo.get_all(department=department, search=search)

    def get_by_id(self, employee_id: int) -> Employee:
        employee = self.repo.get_by_id(employee_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "EMPLOYEE_NOT_FOUND",
                    "message": f"Employee with id {employee_id} not found",
                },
            )
        return employee

    def create(self, data: EmployeeCreate) -> Employee:
        # Check duplicate email
        if self.repo.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_EMAIL",
                    "message": "An employee with this email already exists",
                    "details": {"field": "email", "value": data.email},
                },
            )

        # Check duplicate employee_id
        if self.repo.get_by_employee_id(data.employee_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_EMPLOYEE_ID",
                    "message": f"An employee with ID '{data.employee_id}' already exists",
                    "details": {"field": "employee_id", "value": data.employee_id},
                },
            )

        employee = Employee(
            employee_id=data.employee_id,
            name=data.name,
            email=data.email,
            department=data.department,
        )
        return self.repo.create(employee)

    def update(self, employee_id: int, data: EmployeeUpdate) -> Employee:
        employee = self.get_by_id(employee_id)

        if data.email and data.email != employee.email:
            existing = self.repo.get_by_email(data.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "DUPLICATE_EMAIL",
                        "message": "An employee with this email already exists",
                        "details": {"field": "email", "value": data.email},
                    },
                )

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(employee, field, value)

        return self.repo.update(employee)

    def delete(self, employee_id: int) -> None:
        employee = self.get_by_id(employee_id)
        self.repo.delete(employee)

    def count(self) -> int:
        return self.repo.count()

    def get_departments(self) -> list[str]:
        return self.repo.get_departments()
