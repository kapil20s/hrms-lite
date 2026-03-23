from pydantic import BaseModel
from typing import TypeVar, Generic, Any, Optional

T = TypeVar("T")


class Envelope(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: str = ""
    meta: Optional[dict[str, Any]] = None


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict[str, Any]] = None


class ErrorEnvelope(BaseModel):
    success: bool = False
    error: ErrorDetail
