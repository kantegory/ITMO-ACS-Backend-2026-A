from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class SkillLevel(str, enum.Enum):
    beginner = "beginner"
    middle = "middle"
    expert = "expert"


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)  # from auth-service
    title = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    desired_position = Column(String, nullable=True)
    desired_salary = Column(Integer, nullable=True)
    city = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    work_experience = relationship("WorkExperience", back_populates="resume", cascade="all, delete-orphan")
    education = relationship("Education", back_populates="resume", cascade="all, delete-orphan")
    resume_skills = relationship("ResumeSkill", back_populates="resume", cascade="all, delete-orphan")


class ResumeSkill(Base):
    """Stores skill_id (from vacancy-service) + level for a resume."""
    __tablename__ = "resume_skills"

    id = Column(Integer, primary_key=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, nullable=False)  # ID from vacancy-service
    level = Column(SAEnum(SkillLevel), nullable=True)
    resume = relationship("Resume", back_populates="resume_skills")


class WorkExperience(Base):
    __tablename__ = "work_experience"

    id = Column(Integer, primary_key=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False)
    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    started_at = Column(Date, nullable=False)
    ended_at = Column(Date, nullable=True)
    description = Column(String, nullable=True)
    resume = relationship("Resume", back_populates="work_experience")


class Education(Base):
    __tablename__ = "education"

    id = Column(Integer, primary_key=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False)
    institution = Column(String, nullable=False)
    degree = Column(String, nullable=True)
    field = Column(String, nullable=True)
    started_at = Column(Date, nullable=False)
    graduated_at = Column(Date, nullable=True)
    resume = relationship("Resume", back_populates="education")
