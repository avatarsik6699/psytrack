from fastapi import APIRouter, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.core.config import settings
from app.db.session import get_db
from app.modules.tasks.service import TaskGenerationService

router = APIRouter(prefix="/system/tasks", tags=["system"])


@router.post("/generate", status_code=status.HTTP_200_OK)
async def generate_tasks(
    x_internal_key: str | None = Header(default=None),
    session: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    if x_internal_key != settings.INTERNAL_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    service = TaskGenerationService(session)
    generated = await service.generate_all()
    return {"generated": generated}
