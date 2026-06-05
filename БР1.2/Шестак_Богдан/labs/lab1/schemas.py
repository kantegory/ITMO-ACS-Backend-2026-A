from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List
from enum import Enum


class UserRole(str, Enum):
    applicant = "applicant"
    employer = "employer"


class SkillLevel(str, Enum):
    beginner = "beginner"
    middle = "middle"
    expert = "expert"


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


class ApplicationStatus(str, Enum):
    new = "new"
    viewed = "viewed"
    invited = "invited"
    rejected = "rejected"


#Auth

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int


#User

class UserShort(BaseModel):
    id: int
    email: str
    role: UserRole

    class Config:
        from_attributes = True


class UserProfile(UserShort):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class RegisterResponse(BaseModel):
    user: UserProfile
    tokens: TokenPair


class LoginResponse(BaseModel):
    user: UserProfile
    tokens: TokenPair


#Skill

class SkillResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ResumeSkill(BaseModel):
    skill: SkillResponse
    level: SkillLevel

    class Config:
        from_attributes = True


class SkillListResponse(BaseModel):
    items: List[SkillResponse]


#Work Experience

class WorkExperienceResponse(BaseModel):
    id: int
    company: str
    position: str
    started_at: date
    ended_at: Optional[date] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class CreateExperienceRequest(BaseModel):
    company: str
    position: str
    started_at: date
    ended_at: Optional[date] = None
    description: Optional[str] = None


#Education

class EducationResponse(BaseModel):
    id: int
    institution: str
    degree: Optional[str] = None
    field: Optional[str] = None
    started_at: date
    graduated_at: Optional[date] = None

    class Config:
        from_attributes = True


class CreateEducationRequest(BaseModel):
    institution: str
    degree: Optional[str] = None
    field: Optional[str] = None
    started_at: date
    graduated_at: Optional[date] = None


#Resume

class ResumeShort(BaseModel):
    id: int
    title: str
    desired_position: Optional[str] = None
    desired_salary: Optional[int] = None
    city: Optional[str] = None
    is_published: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class Resume(ResumeShort):
    summary: Optional[str] = None
    skills: List[ResumeSkill] = []
    work_experience: List[WorkExperienceResponse] = []
    education: List[EducationResponse] = []

    class Config:
        from_attributes = True


class CreateResumeRequest(BaseModel):
    title: str
    summary: Optional[str] = None
    desired_position: Optional[str] = None
    desired_salary: Optional[int] = None
    city: Optional[str] = None
    is_published: Optional[bool] = False


class UpdateResumeRequest(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    desired_position: Optional[str] = None
    desired_salary: Optional[int] = None
    city: Optional[str] = None
    is_published: Optional[bool] = None


class ResumeListResponse(BaseModel):
    items: List[ResumeShort]


class SkillEntry(BaseModel):
    skill_id: int
    level: SkillLevel


class UpdateSkillsRequest(BaseModel):
    skills: List[SkillEntry]


#Company

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


#Vacancy

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


#Application

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


class ApplicationListResponse(BaseModel):
    items: List[Application]
    pagination: Pagination


#Error

class ApiError(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None
