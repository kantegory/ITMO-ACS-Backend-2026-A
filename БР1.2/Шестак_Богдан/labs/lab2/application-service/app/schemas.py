from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum


class ApplicationStatus(str, Enum):
    new = "new"
    viewed = "viewed"
    invited = "invited"
    rejected = "rejected"


# Inline vacancy/resume data fetched from other services at response time
class VacancyShort(BaseModel):
    id: int
    title: str
    company_name: str
    company_logo: Optional[str] = None
    city: Optional[str] = None
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    experience: str
    employment_type: str
    published_at: datetime


class ResumeShort(BaseModel):
    id: int
    title: str
    desired_position: Optional[str] = None
    desired_salary: Optional[int] = None
    city: Optional[str] = None
    is_published: bool
    updated_at: datetime


class Application(BaseModel):
    id: int
    vacancy: VacancyShort
    resume: ResumeShort
    cover_letter: Optional[str] = None
    status: ApplicationStatus
    applied_at: datetime

    class Config:
        from_attributes = True


class ApplyRequest(BaseModel):
    resume_id: int
    cover_letter: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: ApplicationStatus


class Pagination(BaseModel):
    total: int
    page: int
    per_page: int
    pages: int


class ApplicationListResponse(BaseModel):
    items: List[Application]
    pagination: Pagination
