from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models import Skill, Company, Vacancy
from app.schemas import (
    SkillResponse, SkillListResponse,
    Company as CompanySchema,
    Vacancy as VacancySchema, VacancyShort,
    CreateVacancyRequest, UpdateVacancyRequest,
    VacancyListResponse, VacancyMyListResponse, Pagination,
    ExperienceLevel, EmploymentType,
)
from app.dependencies import get_current_user

router = APIRouter()


def _get_employer_company(user: dict, db: Session) -> Company:
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can manage vacancies")
    company = db.query(Company).filter(Company.owner_id == user["user_id"]).first()
    if not company:
        raise HTTPException(status_code=403, detail="Company not found. Create one first.")
    return company


def _vacancy_to_schema(v: Vacancy) -> VacancySchema:
    return VacancySchema(
        id=v.id,
        company=CompanySchema.model_validate(v.company),
        title=v.title,
        description=v.description,
        requirements=v.requirements,
        industry=v.industry,
        salary_from=v.salary_from,
        salary_to=v.salary_to,
        experience=v.experience,
        employment_type=v.employment_type,
        city=v.city,
        is_active=v.is_active,
        skills=[SkillResponse.model_validate(s) for s in v.skills],
        published_at=v.published_at,
    )


def _to_short(v: Vacancy) -> VacancyShort:
    return VacancyShort(
        id=v.id,
        title=v.title,
        company_name=v.company.name,
        company_logo=v.company.logo_url,
        city=v.city,
        salary_from=v.salary_from,
        salary_to=v.salary_to,
        experience=v.experience,
        employment_type=v.employment_type,
        published_at=v.published_at,
    )


# ── Skills ───────────────────────────────────────────────────────────────────

@router.get("/skills", response_model=SkillListResponse, tags=["Skills"])
def list_skills(q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Skill)
    if q:
        query = query.filter(Skill.name.ilike(f"%{q}%"))
    return {"items": [SkillResponse.model_validate(s) for s in query.all()]}


@router.get("/skills/{skill_id}", response_model=SkillResponse, tags=["Skills"])
def get_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@router.post("/skills", response_model=SkillResponse, status_code=201, tags=["Skills"])
async def create_skill(name: str, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    if db.query(Skill).filter(Skill.name == name).first():
        raise HTTPException(status_code=409, detail="Skill already exists")
    skill = Skill(name=name)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


# ── Companies ────────────────────────────────────────────────────────────────

@router.post("/companies", response_model=CompanySchema, status_code=201, tags=["Companies"])
async def create_company(
    name: str,
    description: Optional[str] = None,
    industry: Optional[str] = None,
    city: Optional[str] = None,
    website: Optional[str] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can create companies")
    if db.query(Company).filter(Company.owner_id == user["user_id"]).first():
        raise HTTPException(status_code=409, detail="You already have a company")
    company = Company(
        owner_id=user["user_id"],
        name=name,
        description=description,
        industry=industry,
        city=city,
        website=website,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/companies/{company_id}", response_model=CompanySchema, tags=["Companies"])
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


# ── Vacancies ─────────────────────────────────────────────────────────────────

@router.get("/vacancies", response_model=VacancyListResponse, tags=["Vacancies"])
def list_vacancies(
    q: Optional[str] = Query(None),
    industry: Optional[str] = None,
    city: Optional[str] = None,
    salary_from: Optional[int] = None,
    experience: Optional[ExperienceLevel] = None,
    employment_type: Optional[EmploymentType] = None,
    skill_ids: Optional[List[int]] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Vacancy).filter(Vacancy.is_active == True)
    if q:
        query = query.filter(
            (Vacancy.title.ilike(f"%{q}%")) | (Vacancy.description.ilike(f"%{q}%"))
        )
    if industry:
        query = query.filter(Vacancy.industry == industry)
    if city:
        query = query.filter(Vacancy.city == city)
    if salary_from:
        query = query.filter(
            (Vacancy.salary_from >= salary_from) | (Vacancy.salary_to >= salary_from)
        )
    if experience:
        query = query.filter(Vacancy.experience == experience)
    if employment_type:
        query = query.filter(Vacancy.employment_type == employment_type)
    if skill_ids:
        for sid in skill_ids:
            query = query.filter(Vacancy.skills.any(Skill.id == sid))

    total = query.count()
    pages = (total + per_page - 1) // per_page
    vacancies = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [_to_short(v) for v in vacancies],
        "pagination": {"total": total, "page": page, "per_page": per_page, "pages": pages},
    }


@router.get("/vacancies/my", response_model=VacancyMyListResponse, tags=["Vacancies"])
async def list_my_vacancies(
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    company = _get_employer_company(user, db)
    query = db.query(Vacancy).filter(Vacancy.company_id == company.id)
    if is_active is not None:
        query = query.filter(Vacancy.is_active == is_active)

    total = query.count()
    pages = (total + per_page - 1) // per_page
    vacancies = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [_to_short(v) for v in vacancies],
        "pagination": {"total": total, "page": page, "per_page": per_page, "pages": pages},
    }


@router.post("/vacancies", response_model=VacancySchema, status_code=201, tags=["Vacancies"])
async def create_vacancy(
    request: CreateVacancyRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    company = _get_employer_company(user, db)
    vacancy = Vacancy(
        company_id=company.id,
        title=request.title,
        description=request.description,
        requirements=request.requirements,
        industry=request.industry,
        salary_from=request.salary_from,
        salary_to=request.salary_to,
        experience=request.experience,
        employment_type=request.employment_type,
        city=request.city,
    )
    if request.skill_ids:
        skills = db.query(Skill).filter(Skill.id.in_(request.skill_ids)).all()
        vacancy.skills = skills
    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)
    return _vacancy_to_schema(vacancy)


@router.get("/vacancies/{id}", response_model=VacancySchema, tags=["Vacancies"])
def get_vacancy(id: int, db: Session = Depends(get_db)):
    vacancy = db.query(Vacancy).filter(Vacancy.id == id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return _vacancy_to_schema(vacancy)


@router.put("/vacancies/{id}", response_model=VacancySchema, tags=["Vacancies"])
async def update_vacancy(
    id: int,
    request: UpdateVacancyRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    vacancy = db.query(Vacancy).filter(Vacancy.id == id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    company = _get_employer_company(user, db)
    if vacancy.company_id != company.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    fields = ["title", "description", "requirements", "industry",
              "salary_from", "salary_to", "experience", "employment_type", "city", "is_active"]
    for field in fields:
        val = getattr(request, field)
        if val is not None:
            setattr(vacancy, field, val)

    if request.skill_ids is not None:
        vacancy.skills = db.query(Skill).filter(Skill.id.in_(request.skill_ids)).all()

    db.commit()
    db.refresh(vacancy)
    return _vacancy_to_schema(vacancy)


@router.delete("/vacancies/{id}", status_code=204, tags=["Vacancies"])
async def delete_vacancy(
    id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    vacancy = db.query(Vacancy).filter(Vacancy.id == id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    company = _get_employer_company(user, db)
    if vacancy.company_id != company.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(vacancy)
    db.commit()
    return None


# ── Internal endpoint (used by application-service) ──────────────────────────

@router.get("/internal/vacancies/{id}", tags=["Internal"])
def get_vacancy_internal(id: int, db: Session = Depends(get_db)):
    """Returns vacancy info for cross-service validation."""
    v = db.query(Vacancy).filter(Vacancy.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return {
        "id": v.id,
        "title": v.title,
        "is_active": v.is_active,
        "company_id": v.company_id,
        "company_name": v.company.name,
        "company_logo": v.company.logo_url,
        "city": v.city,
        "salary_from": v.salary_from,
        "salary_to": v.salary_to,
        "experience": v.experience,
        "employment_type": v.employment_type,
        "published_at": v.published_at,
        "owner_id": v.company.owner_id,
    }
