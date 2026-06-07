from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum


class ExperienceLevel(str, Enum):
    no_exp = "no_exp"
    one_to_three = "one_to_three"
    three_to_six = "three_to_six"
    six_plus = "six_plus"


class EmploymentType(str, Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    internship = "internship"


class SkillResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class SkillListResponse(BaseModel):
    items: List[SkillResponse]


class Company(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    city: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VacancyShort(BaseModel):
    id: int
    title: str
    company_name: str
    company_logo: Optional[str] = None
    city: Optional[str] = None
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    experience: ExperienceLevel
    employment_type: EmploymentType
    published_at: datetime

    class Config:
        from_attributes = True


class Vacancy(BaseModel):
    id: int
    company: Company
    title: str
    description: str
    requirements: Optional[str] = None
    industry: Optional[str] = None
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    experience: ExperienceLevel
    employment_type: EmploymentType
    city: Optional[str] = None
    is_active: bool
    skills: List[SkillResponse] = []
    published_at: datetime

    class Config:
        from_attributes = True


class CreateVacancyRequest(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    industry: Optional[str] = None
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    experience: ExperienceLevel
    employment_type: EmploymentType
    city: Optional[str] = None
    skill_ids: Optional[List[int]] = None


class UpdateVacancyRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    industry: Optional[str] = None
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    experience: Optional[ExperienceLevel] = None
    employment_type: Optional[EmploymentType] = None
    city: Optional[str] = None
    is_active: Optional[bool] = None
    skill_ids: Optional[List[int]] = None


class Pagination(BaseModel):
    total: int
    page: int
    per_page: int
    pages: int


class VacancyListResponse(BaseModel):
    items: List[VacancyShort]
    pagination: Pagination


class VacancyMyListResponse(BaseModel):
    items: List[VacancyShort]
    pagination: Pagination
