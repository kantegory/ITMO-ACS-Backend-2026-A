from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.get("", response_model=schemas.ResumeListResponse, summary="Список Резюме", description="Возвращает список всех резюме, принадлежащих текущему авторизованному пользователю.")
def list_resumes(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    resumes = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).all()
    return {
        "items": [
            schemas.ResumeShort(
                id=r.id,
                title=r.title,
                desired_position=r.desired_position,
                desired_salary=r.desired_salary,
                city=r.city,
                is_published=r.is_published,
                updated_at=r.updated_at,
            )
            for r in resumes
        ]
    }


@router.post("", response_model=schemas.Resume, status_code=201, summary="Создать Резюме")
def create_resume(
    request: schemas.CreateResumeRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = models.Resume(
        user_id=current_user.id,
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


@router.get("/{id}", response_model=schemas.Resume, summary="Получить конкретное резюме",)
def get_resume(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Check if public or owner
    if not resume.is_published and resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return _resume_to_schema(resume)


@router.put("/{id}", response_model=schemas.Resume, summary="Обновить Резюме")
def update_resume(
    id: int,
    request: schemas.UpdateResumeRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if request.title is not None:
        resume.title = request.title
    if request.summary is not None:
        resume.summary = request.summary
    if request.desired_position is not None:
        resume.desired_position = request.desired_position
    if request.desired_salary is not None:
        resume.desired_salary = request.desired_salary
    if request.city is not None:
        resume.city = request.city
    if request.is_published is not None:
        resume.is_published = request.is_published

    db.commit()
    db.refresh(resume)

    return _resume_to_schema(resume)


@router.delete("/{id}", status_code=204, summary="Удалить Резюме")
def delete_resume(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(resume)
    db.commit()
    return None


@router.post("/{id}/experience", response_model=schemas.WorkExperienceResponse, status_code=201, summary="Добавить опыт работы",)
def add_experience(
    id: int,
    request: schemas.CreateExperienceRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    experience = models.WorkExperience(
        resume_id=id,
        company=request.company,
        position=request.position,
        started_at=request.started_at,
        ended_at=request.ended_at,
        description=request.description,
    )
    db.add(experience)
    db.commit()
    db.refresh(experience)

    return schemas.WorkExperienceResponse.from_orm(experience)


@router.put("/{id}/experience/{exp_id}", response_model=schemas.WorkExperienceResponse, summary="Обновить опыт работы")
def update_experience(
    id: int,
    exp_id: int,
    request: schemas.CreateExperienceRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    experience = db.query(models.WorkExperience).filter(
        models.WorkExperience.id == exp_id, models.WorkExperience.resume_id == id
    ).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")

    experience.company = request.company
    experience.position = request.position
    experience.started_at = request.started_at
    experience.ended_at = request.ended_at
    experience.description = request.description

    db.commit()
    db.refresh(experience)

    return schemas.WorkExperienceResponse.from_orm(experience)


@router.delete("/{id}/experience/{exp_id}", status_code=204, summary="Удалить опыт работы")
def delete_experience(
    id: int,
    exp_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    experience = db.query(models.WorkExperience).filter(
        models.WorkExperience.id == exp_id, models.WorkExperience.resume_id == id
    ).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")

    db.delete(experience)
    db.commit()
    return None


@router.post("/{id}/education", response_model=schemas.EducationResponse, status_code=201, summary="Добавить образование")
def add_education(
    id: int,
    request: schemas.CreateEducationRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    education = models.Education(
        resume_id=id,
        institution=request.institution,
        degree=request.degree,
        field=request.field,
        started_at=request.started_at,
        graduated_at=request.graduated_at,
    )
    db.add(education)
    db.commit()
    db.refresh(education)

    return schemas.EducationResponse.from_orm(education)


@router.put("/{id}/education/{edu_id}", response_model=schemas.EducationResponse, summary="Обновить образование")
def update_education(
    id: int,
    edu_id: int,
    request: schemas.CreateEducationRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    education = db.query(models.Education).filter(
        models.Education.id == edu_id, models.Education.resume_id == id
    ).first()
    if not education:
        raise HTTPException(status_code=404, detail="Education not found")

    education.institution = request.institution
    education.degree = request.degree
    education.field = request.field
    education.started_at = request.started_at
    education.graduated_at = request.graduated_at

    db.commit()
    db.refresh(education)

    return schemas.EducationResponse.from_orm(education)


@router.delete("/{id}/education/{edu_id}", status_code=204, summary="Удалить образование" )
def delete_education(
    id: int,
    edu_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    education = db.query(models.Education).filter(
        models.Education.id == edu_id, models.Education.resume_id == id
    ).first()
    if not education:
        raise HTTPException(status_code=404, detail="Education not found")

    db.delete(education)
    db.commit()
    return None


@router.put("/{id}/skills", response_model=list, summary="Обновить скиллы")
def update_skills(
    id: int,
    request: schemas.UpdateSkillsRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Clear existing skills
    resume.skills.clear()

    # Add new skills
    for skill_entry in request.skills:
        skill = db.query(models.Skill).filter(models.Skill.id == skill_entry.skill_id).first()
        if skill:
            resume.skills.append(skill)

    db.commit()
    db.refresh(resume)

    return [
        {
            "skill": {"id": s.id, "name": s.name},
            "level": "beginner",  # Simplified - in production would need a separate table
        }
        for s in resume.skills
    ]


def _resume_to_schema(resume: models.Resume) -> schemas.Resume:
    return schemas.Resume(
        id=resume.id,
        title=resume.title,
        desired_position=resume.desired_position,
        desired_salary=resume.desired_salary,
        city=resume.city,
        is_published=resume.is_published,
        updated_at=resume.updated_at,
        summary=resume.summary,
        skills=[],  # Simplified
        work_experience=[schemas.WorkExperienceResponse.from_orm(e) for e in resume.work_experience],
        education=[schemas.EducationResponse.from_orm(e) for e in resume.education],
    )
