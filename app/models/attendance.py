from sqlalchemy import String, Integer, Date, ForeignKey, UniqueConstraint, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, datetime
from app.db.database import Base


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_employee_date"),
        CheckConstraint("status IN ('present', 'absent')", name="ck_attendance_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    employee: Mapped["Employee"] = relationship("Employee", back_populates="attendance_records")

    def __repr__(self) -> str:
        return f"<Attendance(id={self.id}, employee_id={self.employee_id}, date={self.date}, status='{self.status}')>"
