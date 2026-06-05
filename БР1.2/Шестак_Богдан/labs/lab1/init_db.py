#!/usr/bin/env python
"""Initialize database with sample data"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date

import models
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(bind=engine)


def init_db():
    # Create tables
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Add sample skills
        skills = [
            "Python", "JavaScript", "React", "Django", "FastAPI",
            "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS",
            "Java", "Go", "Rust", "C++", "DevOps"
        ]

        for skill_name in skills:
            if not db.query(models.Skill).filter(models.Skill.name == skill_name).first():
                skill = models.Skill(name=skill_name)
                db.add(skill)

        db.commit()
        print("✓ Skills added")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
