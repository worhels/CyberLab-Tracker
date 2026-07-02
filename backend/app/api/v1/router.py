from fastapi import APIRouter

from app.api.v1.endpoints import auth, dashboard, export, mentor, settings, subjects, tasks

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(subjects.router)
api_router.include_router(tasks.router)
api_router.include_router(dashboard.router)
api_router.include_router(settings.router)
api_router.include_router(export.router)
api_router.include_router(mentor.router)
