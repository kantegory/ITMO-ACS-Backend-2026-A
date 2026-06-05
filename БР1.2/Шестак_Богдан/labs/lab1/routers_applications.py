from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

import models
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(tags=["Applications"])


@router.post("/vacancies/{id}/apply", response_model=schemas.Application, status_code=201, summary="Откликнуться на вакансию")
def apply(
    id: int,
    request: schemas.ApplyRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only applicants can apply
    if current_user.role != models.UserRole.applicant:
        raise HTTPException(status_code=403, detail="Only applicants can apply")

    # Check vacancy exists
    vacancy = db.query(models.Vacancy).filter(models.Vacancy.id == id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    # Check resume exists and belongs to user
    resume = db.query(models.Resume).filter(
        models.Resume.id == request.resume_id, models.Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=400, detail="Resume not found")

    # Check if already applied
    existing = db.query(models.Application).filter(
        models.Application.vacancy_id == id,
        models.Application.resume_id == request.resume_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already applied to this vacancy")

    application = models.Application(
        vacancy_id=id,
        user_id=current_user.id,
        resume_id=request.resume_id,
        cover_letter=request.cover_letter,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return _application_to_schema(application)


@router.get("/applications/my", response_model=schemas.ApplicationListResponse, summary="Мои отклики")
def list_my_applications(
    status: Optional[schemas.ApplicationStatus] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only applicants can view their applications
    if current_user.role != models.UserRole.applicant:
        raise HTTPException(status_code=403, detail="Only applicants can view their applications")

    query = db.query(models.Application).filter(models.Application.user_id == current_user.id)
    if status:
        query = query.filter(models.Application.status == status)

    total = query.count()
    pages = (total + per_page - 1) // per_page
    applications = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [_application_to_schema(app) for app in applications],
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages,
        },
    }


@router.get("/vacancies/{id}/applications", response_model=schemas.ApplicationListResponse, summary="Отклики на вакансию", description="Возвращает список заявок на вакансию. Доступно только владельцу вакансии.")
def list_vacancy_applications(
    id: int,
    status: Optional[schemas.ApplicationStatus] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only employer can view applications for their vacancy
    if current_user.role != models.UserRole.employer:
        raise HTTPException(status_code=403, detail="Only employers can view applications")

    vacancy = db.query(models.Vacancy).filter(models.Vacancy.id == id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    if vacancy.company.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = db.query(models.Application).filter(models.Application.vacancy_id == id)
    if status:
        query = query.filter(models.Application.status == status)

    total = query.count()
    pages = (total + per_page - 1) // per_page
    applications = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [_application_to_schema(app) for app in applications],
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages,
        },
    }


@router.patch("/applications/{id}/status", response_model=schemas.Application, summary="Обновить статус отклика")
def update_status(
    id: int,
    request: schemas.UpdateStatusRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only employer can update status
    if current_user.role != models.UserRole.employer:
        raise HTTPException(status_code=403, detail="Only employers can update application status")

    application = db.query(models.Application).filter(models.Application.id == id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.vacancy.company.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    application.status = request.status
    db.commit()
    db.refresh(application)

    return _application_to_schema(application)


def _application_to_schema(application: models.Application) -> schemas.Application:
    return schemas.Application(
        id=application.id,
        vacancy=schemas.VacancyShort(
            id=application.vacancy.id,
            title=application.vacancy.title,
            company_name=application.vacancy.company.name,
            company_logo=application.vacancy.company.logo_url,
            city=application.vacancy.city,
            salary_from=application.vacancy.salary_from,
            salary_to=application.vacancy.salary_to,
            experience=application.vacancy.experience,
            employment_type=application.vacancy.employment_type,
            published_at=application.vacancy.published_at,
        ),
        resume=schemas.ResumeShort(
            id=application.resume.id,
            title=application.resume.title,
            desired_position=application.resume.desired_position,
            desired_salary=application.resume.desired_salary,
            city=application.resume.city,
            is_published=application.resume.is_published,
            updated_at=application.resume.updated_at,
        ),
        cover_letter=application.cover_letter,
        status=application.status,
        applied_at=application.applied_at,
    )
