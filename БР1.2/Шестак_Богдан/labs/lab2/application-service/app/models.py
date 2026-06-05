from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum
from datetime import datetime
import enum
from app.database import Base


class ApplicationStatus(str, enum.Enum):
    new = "new"
    viewed = "viewed"
    invited = "invited"
    rejected = "rejected"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True)
    vacancy_id = Column(Integer, nullable=False, index=True)   # from vacancy-service
    user_id = Column(Integer, nullable=False, index=True)      # from auth-service
    resume_id = Column(Integer, nullable=False, index=True)    # from resume-service
    cover_letter = Column(String, nullable=True)
    status = Column(SAEnum(ApplicationStatus), default=ApplicationStatus.new)
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
