from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models import Application, ApplicationStatus
from app.schemas import (
    Application as AppSchema, ApplyRequest, UpdateStatusRequest,
    ApplicationListResponse, Pagination, VacancyShort, ResumeShort,
)
from app.dependencies import get_current_user, fetch_vacancy, fetch_resume

router = APIRouter(tags=["Applications"])


def _make_vacancy_short(v: dict) -> VacancyShort:
    return VacancyShort(
        id=v["id"], title=v["title"],
        company_name=v["company_name"], company_logo=v.get("company_logo"),
        city=v.get("city"), salary_from=v.get("salary_from"), salary_to=v.get("salary_to"),
        experience=v["experience"], employment_type=v["employment_type"],
        published_at=v["published_at"],
    )


def _make_resume_short(r: dict) -> ResumeShort:
    return ResumeShort(
        id=r["id"], title=r["title"],
        desired_position=r.get("desired_position"), desired_salary=r.get("desired_salary"),
        city=r.get("city"), is_published=r["is_published"], updated_at=r["updated_at"],
    )


async def _app_to_schema(app: Application) -> AppSchema:
    vacancy_data = await fetch_vacancy(app.vacancy_id)
    resume_data = await fetch_resume(app.resume_id)
    return AppSchema(
        id=app.id,
        vacancy=_make_vacancy_short(vacancy_data),
        resume=_make_resume_short(resume_data),
        cover_letter=app.cover_letter,
        status=app.status,
        applied_at=app.applied_at,
    )


# ── Apply ─────────────────────────────────────────────────────────────────────

@router.post("/vacancies/{id}/apply", response_model=AppSchema, status_code=201, summary="Откликнуться на вакансию")
async def apply(
    id: int,
    request: ApplyRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user["role"] != "applicant":
        raise HTTPException(status_code=403, detail="Only applicants can apply")

    # Validate vacancy exists and is active
    vacancy_data = await fetch_vacancy(id)
    if not vacancy_data.get("is_active"):
        raise HTTPException(status_code=400, detail="Vacancy is not active")

    # Validate resume exists and belongs to user
    resume_data = await fetch_resume(request.resume_id)
    if resume_data["user_id"] != user["user_id"]:
        raise HTTPException(status_code=400, detail="Resume not found or doesn't belong to you")

    # Check for duplicate application
    existing = db.query(Application).filter(
        Application.vacancy_id == id,
        Application.resume_id == request.resume_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already applied to this vacancy")

    application = Application(
        vacancy_id=id,
        user_id=user["user_id"],
        resume_id=request.resume_id,
        cover_letter=request.cover_letter,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return await _app_to_schema(application)


# ── My applications (applicant) ───────────────────────────────────────────────

@router.get("/applications/my", response_model=ApplicationListResponse, summary="Мои отклики")
async def list_my_applications(
    status: Optional[ApplicationStatus] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user["role"] != "applicant":
        raise HTTPException(status_code=403, detail="Only applicants can view their applications")

    query = db.query(Application).filter(Application.user_id == user["user_id"])
    if status:
        query = query.filter(Application.status == status)

    total = query.count()
    pages = (total + per_page - 1) // per_page
    applications = query.offset((page - 1) * per_page).limit(per_page).all()

    items = [await _app_to_schema(a) for a in applications]
    return {
        "items": items,
        "pagination": {"total": total, "page": page, "per_page": per_page, "pages": pages},
    }


# ── Vacancy applications (employer) ──────────────────────────────────────────

@router.get("/vacancies/{id}/applications", response_model=ApplicationListResponse, summary="Отклики на вакансию")
async def list_vacancy_applications(
    id: int,
    status: Optional[ApplicationStatus] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can view applications")

    # Verify this employer owns the vacancy
    vacancy_data = await fetch_vacancy(id)
    if vacancy_data["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = db.query(Application).filter(Application.vacancy_id == id)
    if status:
        query = query.filter(Application.status == status)

    total = query.count()
    pages = (total + per_page - 1) // per_page
    applications = query.offset((page - 1) * per_page).limit(per_page).all()

    items = [await _app_to_schema(a) for a in applications]
    return {
        "items": items,
        "pagination": {"total": total, "page": page, "per_page": per_page, "pages": pages},
    }


# ── Update status (employer) ──────────────────────────────────────────────────

@router.patch("/applications/{id}/status", response_model=AppSchema, summary="Обновить статус отклика")
async def update_status(
    id: int,
    request: UpdateStatusRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can update application status")

    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify employer owns the vacancy
    vacancy_data = await fetch_vacancy(application.vacancy_id)
    if vacancy_data["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    application.status = request.status
    db.commit()
    db.refresh(application)

    return await _app_to_schema(application)
