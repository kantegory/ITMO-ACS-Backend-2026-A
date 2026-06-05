from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List

import models
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/vacancies", tags=["Vacancies"])


def get_company(user: models.User, db: Session) -> models.Company:
    """Get company for current user (must be employer)"""
    if user.role != models.UserRole.employer:
        raise HTTPException(status_code=403, detail="Only employers can manage vacancies")

    company = db.query(models.Company).filter(models.Company.owner_id == user.id).first()
    if not company:
        raise HTTPException(status_code=403, detail="Company not found")

    return company


@router.get("", response_model=schemas.VacancyListResponse, summary="Список вакансий")
def list_vacancies(
    q: Optional[str] = Query(None),
    industry: Optional[str] = None,
    city: Optional[str] = None,
    salary_from: Optional[int] = None,
    experience: Optional[schemas.ExperienceLevel] = None,
    employment_type: Optional[schemas.EmploymentType] = None,
    skill_ids: Optional[List[int]] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.Vacancy).filter(models.Vacancy.is_active == True)

    if q:
        query = query.filter(
            (models.Vacancy.title.ilike(f"%{q}%")) | (models.Vacancy.description.ilike(f"%{q}%"))
        )
    if industry:
        query = query.filter(models.Vacancy.industry == industry)
    if city:
        query = query.filter(models.Vacancy.city == city)
    if salary_from:
        query = query.filter(
            (models.Vacancy.salary_from >= salary_from) | (models.Vacancy.salary_to >= salary_from)
        )
    if experience:
        query = query.filter(models.Vacancy.experience == experience)
    if employment_type:
        query = query.filter(models.Vacancy.employment_type == employment_type)
    if skill_ids:
        for skill_id in skill_ids:
            query = query.filter(models.Vacancy.skills.any(models.Skill.id == skill_id))

    total = query.count()
    pages = (total + per_page - 1) // per_page
    vacancies = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [
            schemas.VacancyShort(
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
            for v in vacancies
        ],
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages,
        },
    }


@router.post("", response_model=schemas.Vacancy, status_code=201, summary="Создать Вакансию")
def create_vacancy(
    request: schemas.CreateVacancyRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = get_company(current_user, db)

    vacancy = models.Vacancy(
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
        skills = db.query(models.Skill).filter(models.Skill.id.in_(request.skill_ids)).all()
        vacancy.skills = skills

    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)

    return _vacancy_to_schema(vacancy)


@router.get("/my", response_model=schemas.VacancyMyListResponse, summary="Список моих вакансий")
def list_my_vacancies(
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = get_company(current_user, db)

    query = db.query(models.Vacancy).filter(models.Vacancy.company_id == company.id)
    if is_active is not None:
        query = query.filter(models.Vacancy.is_active == is_active)

    total = query.count()
    pages = (total + per_page - 1) // per_page
    vacancies = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [
            schemas.VacancyShort(
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
            for v in vacancies
        ],
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages,
        },
    }


@router.get("/{id}", response_model=schemas.Vacancy, summary="Получить Вакансию")
def get_vacancy(id: int, db: Session = Depends(get_db)):
    vacancy = db.query(models.Vacancy).filter(models.Vacancy.id == id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    return _vacancy_to_schema(vacancy)


@router.put("/{id}", response_model=schemas.Vacancy, summary="Обновить вакансию")
def update_vacancy(
    id: int,
    request: schemas.UpdateVacancyRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vacancy = db.query(models.Vacancy).filter(models.Vacancy.id == id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    company = get_company(current_user, db)
    if vacancy.company_id != company.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if request.title is not None:
        vacancy.title = request.title
    if request.description is not None:
        vacancy.description = request.description
    if request.requirements is not None:
        vacancy.requirements = request.requirements
    if request.industry is not None:
        vacancy.industry = request.industry
    if request.salary_from is not None:
        vacancy.salary_from = request.salary_from
    if request.salary_to is not None:
        vacancy.salary_to = request.salary_to
    if request.experience is not None:
        vacancy.experience = request.experience
    if request.employment_type is not None:
        vacancy.employment_type = request.employment_type
    if request.city is not None:
        vacancy.city = request.city
    if request.is_active is not None:
        vacancy.is_active = request.is_active

    if request.skill_ids is not None:
        skills = db.query(models.Skill).filter(models.Skill.id.in_(request.skill_ids)).all()
        vacancy.skills = skills

    db.commit()
    db.refresh(vacancy)

    return _vacancy_to_schema(vacancy)


@router.delete("/{id}", status_code=204, summary="Удалить Вакансию")
def delete_vacancy(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vacancy = db.query(models.Vacancy).filter(models.Vacancy.id == id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    company = get_company(current_user, db)
    if vacancy.company_id != company.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(vacancy)
    db.commit()
    return None


def _vacancy_to_schema(vacancy: models.Vacancy) -> schemas.Vacancy:
    return schemas.Vacancy(
        id=vacancy.id,
        company=schemas.Company.from_orm(vacancy.company),
        title=vacancy.title,
        description=vacancy.description,
        requirements=vacancy.requirements,
        industry=vacancy.industry,
        salary_from=vacancy.salary_from,
        salary_to=vacancy.salary_to,
        experience=vacancy.experience,
        employment_type=vacancy.employment_type,
        city=vacancy.city,
        is_active=vacancy.is_active,
        skills=[schemas.SkillResponse.from_orm(s) for s in vacancy.skills],
        published_at=vacancy.published_at,
    )
