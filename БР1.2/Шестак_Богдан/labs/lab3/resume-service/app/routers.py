from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Resume, ResumeSkill, WorkExperience, Education
from app.schemas import (
    ResumeShort, Resume as ResumeSchema, ResumeListResponse,
    CreateResumeRequest, UpdateResumeRequest,
    WorkExperienceResponse, CreateExperienceRequest,
    EducationResponse, CreateEducationRequest,
    UpdateSkillsRequest,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/resumes", tags=["Resumes"])


def _resume_to_schema(resume: Resume) -> ResumeSchema:
    return ResumeSchema(
        id=resume.id,
        title=resume.title,
        desired_position=resume.desired_position,
        desired_salary=resume.desired_salary,
        city=resume.city,
        is_published=resume.is_published,
        updated_at=resume.updated_at,
        summary=resume.summary,
        skills=[{"skill_id": rs.skill_id, "level": rs.level} for rs in resume.resume_skills],
        work_experience=[WorkExperienceResponse.model_validate(e) for e in resume.work_experience],
        education=[EducationResponse.model_validate(e) for e in resume.education],
    )


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=ResumeListResponse, summary="Список резюме")
async def list_resumes(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    resumes = db.query(Resume).filter(Resume.user_id == user["user_id"]).all()
    return {"items": [ResumeShort.model_validate(r) for r in resumes]}


@router.post("", response_model=ResumeSchema, status_code=201, summary="Создать резюме")
async def create_resume(
    request: CreateResumeRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = Resume(
        user_id=user["user_id"],
        title=request.title,
        summary=request.summary,
        desired_position=request.desired_position,
        desired_salary=request.desired_salary,
        city=request.city,
        is_published=request.is_published or False,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return _resume_to_schema(resume)


@router.get("/{id}", response_model=ResumeSchema, summary="Получить резюме")
async def get_resume(id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.is_published and resume.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return _resume_to_schema(resume)


@router.put("/{id}", response_model=ResumeSchema, summary="Обновить резюме")
async def update_resume(
    id: int,
    request: UpdateResumeRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    for field in ["title", "summary", "desired_position", "desired_salary", "city", "is_published"]:
        val = getattr(request, field)
        if val is not None:
            setattr(resume, field, val)

    db.commit()
    db.refresh(resume)
    return _resume_to_schema(resume)


@router.delete("/{id}", status_code=204, summary="Удалить резюме")
async def delete_resume(id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(resume)
    db.commit()
    return None


# ── Work Experience ───────────────────────────────────────────────────────────

@router.post("/{id}/experience", response_model=WorkExperienceResponse, status_code=201, summary="Добавить опыт работы")
async def add_experience(
    id: int, request: CreateExperienceRequest,
    user: dict = Depends(get_current_user), db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    exp = WorkExperience(resume_id=id, **request.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return WorkExperienceResponse.model_validate(exp)


@router.put("/{id}/experience/{exp_id}", response_model=WorkExperienceResponse, summary="Обновить опыт работы")
async def update_experience(
    id: int, exp_id: int, request: CreateExperienceRequest,
    user: dict = Depends(get_current_user), db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume or resume.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    exp = db.query(WorkExperience).filter(WorkExperience.id == exp_id, WorkExperience.resume_id == id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    for k, v in request.model_dump().items():
        setattr(exp, k, v)
    db.commit()
    db.refresh(exp)
    return WorkExperienceResponse.model_validate(exp)


@router.delete("/{id}/experience/{exp_id}", status_code=204, summary="Удалить опыт работы")
async def delete_experience(
    id: int, exp_id: int,
    user: dict = Depends(get_current_user), db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume or resume.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    exp = db.query(WorkExperience).filter(WorkExperience.id == exp_id, WorkExperience.resume_id == id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    db.delete(exp)
    db.commit()
    return None


# ── Education ─────────────────────────────────────────────────────────────────

@router.post("/{id}/education", response_model=EducationResponse, status_code=201, summary="Добавить образование")
async def add_education(
    id: int, request: CreateEducationRequest,
    user: dict = Depends(get_current_user), db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume or resume.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    edu = Education(resume_id=id, **request.model_dump())
    db.add(edu)
    db.commit()
    db.refresh(edu)
    return EducationResponse.model_validate(edu)


@router.put("/{id}/education/{edu_id}", response_model=EducationResponse, summary="Обновить образование")
async def update_education(
    id: int, edu_id: int, request: CreateEducationRequest,
    user: dict = Depends(get_current_user), db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume or resume.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    edu = db.query(Education).filter(Education.id == edu_id, Education.resume_id == id).first()
    if not edu:
        raise HTTPException(status_code=404, detail="Education not found")
    for k, v in request.model_dump().items():
        setattr(edu, k, v)
    db.commit()
    db.refresh(edu)
    return EducationResponse.model_validate(edu)


@router.delete("/{id}/education/{edu_id}", status_code=204, summary="Удалить образование")
async def delete_education(
    id: int, edu_id: int,
    user: dict = Depends(get_current_user), db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume or resume.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    edu = db.query(Education).filter(Education.id == edu_id, Education.resume_id == id).first()
    if not edu:
        raise HTTPException(status_code=404, detail="Education not found")
    db.delete(edu)
    db.commit()
    return None


# ── Skills ────────────────────────────────────────────────────────────────────

@router.put("/{id}/skills", summary="Обновить навыки резюме")
async def update_skills(
    id: int, request: UpdateSkillsRequest,
    user: dict = Depends(get_current_user), db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume or resume.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).delete()
    for entry in request.skills:
        db.add(ResumeSkill(resume_id=id, skill_id=entry.skill_id, level=entry.level))
    db.commit()
    db.refresh(resume)

    return [{"skill_id": rs.skill_id, "level": rs.level} for rs in resume.resume_skills]


# ── Internal (used by application-service) ───────────────────────────────────

@router.get("/internal/{resume_id}", tags=["Internal"])
def get_resume_internal(resume_id: int, db: Session = Depends(get_db)):
    """Returns resume info for cross-service validation."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {
        "id": resume.id,
        "user_id": resume.user_id,
        "title": resume.title,
        "desired_position": resume.desired_position,
        "desired_salary": resume.desired_salary,
        "city": resume.city,
        "is_published": resume.is_published,
        "updated_at": resume.updated_at,
    }
