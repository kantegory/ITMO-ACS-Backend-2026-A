from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, Enum as SQLEnum, Date, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

# Association tables for many-to-many relationships
resume_skills = Table(
    'resume_skills',
    Base.metadata,
    Column('resume_id', Integer, ForeignKey('resumes.id', ondelete='CASCADE')),
    Column('skill_id', Integer, ForeignKey('skills.id')),
    Column('level', String, nullable=True),
)

vacancy_skills = Table(
    'vacancy_skills',
    Base.metadata,
    Column('vacancy_id', Integer, ForeignKey('vacancies.id', ondelete='CASCADE')),
    Column('skill_id', Integer, ForeignKey('skills.id')),
)


class UserRole(str, enum.Enum):
    applicant = "applicant"
    employer = "employer"


class SkillLevel(str, enum.Enum):
    beginner = "beginner"
    middle = "middle"
    expert = "expert"


class ExperienceLevel(str, enum.Enum):
    no_exp = "no_exp"
    one_to_three = "one_to_three"
    three_to_six = "three_to_six"
    six_plus = "six_plus"


class EmploymentType(str, enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    internship = "internship"


class ApplicationStatus(str, enum.Enum):
    new = "new"
    viewed = "viewed"
    invited = "invited"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    resumes = relationship("Resume", back_populates="user")
    applications = relationship("Application", back_populates="user")
    company = relationship("Company", back_populates="owner", uselist=False)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True, nullable=False)
    resumes = relationship("Resume", secondary="resume_skills", back_populates="skills")

    vacancies = relationship("Vacancy", secondary=vacancy_skills, back_populates="skills")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    city = Column(String, nullable=True)
    website = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="company")
    vacancies = relationship("Vacancy", back_populates="company")


class Vacancy(Base):
    __tablename__ = "vacancies"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    requirements = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    salary_from = Column(Integer, nullable=True)
    salary_to = Column(Integer, nullable=True)
    experience = Column(SQLEnum(ExperienceLevel), nullable=False)
    employment_type = Column(SQLEnum(EmploymentType), nullable=False)
    city = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    published_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="vacancies")
    applications = relationship("Application", back_populates="vacancy")
    skills = relationship("Skill", secondary=vacancy_skills, back_populates="vacancies")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    desired_position = Column(String, nullable=True)
    desired_salary = Column(Integer, nullable=True)
    city = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="resumes")
    work_experience = relationship("WorkExperience", back_populates="resume")
    education = relationship("Education", back_populates="resume")
    applications = relationship("Application", back_populates="resume")
    skills = relationship("Skill", secondary="resume_skills", back_populates="resumes")


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


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True)
    vacancy_id = Column(Integer, ForeignKey('vacancies.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    resume_id = Column(Integer, ForeignKey('resumes.id'), nullable=False)
    cover_letter = Column(String, nullable=True)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.new)
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    vacancy = relationship("Vacancy", back_populates="applications")
    user = relationship("User", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
