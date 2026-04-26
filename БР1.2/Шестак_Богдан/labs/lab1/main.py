from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine
from routers_auth import router as auth_router
from routers_users import router as users_router
from routers_skills import router as skills_router
from routers_vacancies import router as vacancies_router
from routers_resumes import router as resumes_router
from routers_applications import router as applications_router

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Job Search API",
    description="API for job search platform",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(skills_router)
app.include_router(vacancies_router)
app.include_router(resumes_router)
app.include_router(applications_router)


@app.get("/")
def read_root():
    return {"message": "Job Search API v1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
