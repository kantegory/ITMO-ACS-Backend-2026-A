from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
from enum import Enum


class SkillLevel(str, Enum):
    beginner = "beginner"
    middle = "middle"
    expert = "expert"


class SkillResponse(BaseModel):
    id: int
    name: str


class ResumeSkill(BaseModel):
    skill_id: int
    level: Optional[SkillLevel] = None

    class Config:
        from_attributes = True


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
