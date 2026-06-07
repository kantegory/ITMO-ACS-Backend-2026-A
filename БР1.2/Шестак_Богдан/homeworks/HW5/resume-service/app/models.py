from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


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


vacancy_skills = Table(
    'vacancy_skills', Base.metadata,
    Column('vacancy_id', Integer, ForeignKey('vacancies.id', ondelete='CASCADE')),
    Column('skill_id', Integer, ForeignKey('skills.id')),
)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True, nullable=False)
    vacancies = relationship("Vacancy", secondary=vacancy_skills, back_populates="skills")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, nullable=False, index=True)  # user_id from auth-service
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    city = Column(String, nullable=True)
    website = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
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
    experience = Column(SAEnum(ExperienceLevel), nullable=False)
    employment_type = Column(SAEnum(EmploymentType), nullable=False)
    city = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    published_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    company = relationship("Company", back_populates="vacancies")
    skills = relationship("Skill", secondary=vacancy_skills, back_populates="vacancies")
