"""Employee API endpoints — thin routing layer."""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.common import Envelope
from app.schemas.employee import EmployeeCreate, EmployeeResponse, EmployeeUpdate
from app.services.employee import EmployeeService

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=Envelope[list[EmployeeResponse]])
def list_employees(
    department: Optional[str] = Query(None, description="Filter by department"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db),
):
    service = EmployeeService(db)
    employees = service.get_all(department=department, search=search)
    return Envelope(
        data=[EmployeeResponse.model_validate(e) for e in employees],
        message=f"Found {len(employees)} employee(s)",
    )


@router.get("/departments", response_model=Envelope[list[str]])
def list_departments(db: Session = Depends(get_db)):
    service = EmployeeService(db)
    departments = service.get_departments()
    return Envelope(data=departments, message=f"Found {len(departments)} department(s)")


@router.get("/{employee_id}", response_model=Envelope[EmployeeResponse])
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    service = EmployeeService(db)
    employee = service.get_by_id(employee_id)
    return Envelope(data=EmployeeResponse.model_validate(employee), message="Employee found")


@router.post(
    "", response_model=Envelope[EmployeeResponse], status_code=status.HTTP_201_CREATED
)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    service = EmployeeService(db)
    employee = service.create(data)
    return Envelope(
        data=EmployeeResponse.model_validate(employee),
        message="Employee created successfully",
    )


@router.put("/{employee_id}", response_model=Envelope[EmployeeResponse])
def update_employee(
    employee_id: int, data: EmployeeUpdate, db: Session = Depends(get_db)
):
    service = EmployeeService(db)
    employee = service.update(employee_id, data)
    return Envelope(
        data=EmployeeResponse.model_validate(employee),
        message="Employee updated successfully",
    )


@router.delete("/{employee_id}", response_model=Envelope[dict])
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    service = EmployeeService(db)
    service.delete(employee_id)
    return Envelope(data={}, message="Employee deleted successfully")
