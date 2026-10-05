import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from database import get_session
from models import Content, Project, Workspace

router = APIRouter(prefix="/api/public", tags=["public"])
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")


@router.get("/content/{slug}")
def get_public_content(slug: str, session: Session = Depends(get_session)):
    stmt = select(Content).where(Content.slug == slug, Content.is_published == True)
    content = session.exec(stmt).first()
    if not content:
        raise HTTPException(status_code=404, detail="Published content not found")

    project = session.get(Project, content.project_id)
    workspace = session.get(Workspace, project.workspace_id) if project else None

    return {
        "id": content.id,
        "title": content.title,
        "slug": content.slug,
        "content_type": content.content_type.value if hasattr(content.content_type, "value") else str(content.content_type),
        "body_text": content.body_text,
        "file_url": content.file_url,
        "file_name": content.file_name,
        "file_size": content.file_size,
        "mime_type": content.mime_type,
        "is_published": content.is_published,
        "created_at": content.created_at.isoformat(),
        "updated_at": content.updated_at.isoformat(),
        "project": {
            "id": project.id if project else None,
            "name": project.name if project else "General Project",
            "slug": project.slug if project else "general"
        } if project else None,
        "workspace": {
            "id": workspace.id if workspace else None,
            "name": workspace.name if workspace else "Public Workspace"
        } if workspace else None
    }


@router.get("/showcase")
def get_public_showcase(session: Session = Depends(get_session)):
    stmt = select(Content).where(Content.is_published == True).limit(12)
    contents = session.exec(stmt).all()
    results = []
    for c in contents:
        p = session.get(Project, c.project_id)
        w = session.get(Workspace, p.workspace_id) if p else None
        results.append({
            "id": c.id,
            "title": c.title,
            "slug": c.slug,
            "content_type": c.content_type.value if hasattr(c.content_type, "value") else str(c.content_type),
            "file_name": c.file_name,
            "file_size": c.file_size,
            "created_at": c.created_at.isoformat(),
            "project_name": p.name if p else None,
            "workspace_name": w.name if w else None
        })
    return results


@router.get("/download/{slug}")
def download_public_content(slug: str, session: Session = Depends(get_session)):
    stmt = select(Content).where(Content.slug == slug, Content.is_published == True)
    content = session.exec(stmt).first()
    if not content or not content.file_url:
        raise HTTPException(status_code=404, detail="File attachment not available")
    disk_path = os.path.join(UPLOAD_DIR, os.path.basename(content.file_url))
    if not os.path.exists(disk_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=disk_path,
        filename=content.file_name or "download",
        media_type=content.mime_type or "application/octet-stream"
    )
