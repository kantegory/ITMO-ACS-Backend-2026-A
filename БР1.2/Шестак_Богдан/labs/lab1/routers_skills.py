from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("", response_model=schemas.SkillListResponse)
def list_skills(q: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Skill)
    if q:
        query = query.filter(models.Skill.name.ilike(f"%{q}%"))

    skills = query.all()
    return {"items": [schemas.SkillResponse.from_orm(skill) for skill in skills]}
