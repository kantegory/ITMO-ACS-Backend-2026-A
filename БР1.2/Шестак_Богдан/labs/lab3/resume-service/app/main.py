import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Resume Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router)


@app.on_event("startup")
async def startup():
    from app.consumer import start_consumer
    asyncio.create_task(start_consumer())


@app.get("/health")
def health():
    return {"status": "ok", "service": "resume-service"}
