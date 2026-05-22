from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

import app.modules.doctors  # noqa: F401
import app.modules.patients  # noqa: F401
import app.modules.tasks  # noqa: F401
import app.modules.therapy_goals  # noqa: F401
import app.modules.users  # noqa: F401
from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.middleware import register_middleware
from app.core.rate_limit import limiter
from app.db.session import close_db, init_db, get_db

configure_logging()


async def _run_task_generation() -> None:
    from app.modules.tasks.service import TaskGenerationService

    async for session in get_db():
        service = TaskGenerationService(session)
        await service.generate_all()
        await session.commit()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    await init_db()
    scheduler = AsyncIOScheduler()
    scheduler.add_job(_run_task_generation, "cron", hour=0, minute=5)
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        await close_db()


app = FastAPI(
    title="Docassist",
    version="0.1.0",
    description="Psychiatric inter-visit monitoring",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_middleware(app)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(api_v1_router)
