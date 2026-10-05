import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import Session, select
from database import get_session
from models import User, Workspace, Project, Content, ContentType
from auth import get_current_user

router = APIRouter(prefix="/api/contents", tags=["contents"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ContentCreate(BaseModel):
    project_id: int
    title: str
    content_type: ContentType
    body_text: Optional[str] = None
    is_published: bool = False


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    body_text: Optional[str] = None
    is_published: Optional[bool] = None


def check_project_ownership(project_id: int, user_id: int, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    workspace = session.get(Workspace, project.workspace_id)
    if not workspace or workspace.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized workspace access")
    return project


def check_content_ownership(content_id: int, user_id: int, session: Session) -> Content:
    content = session.get(Content, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    project = session.get(Project, content.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    workspace = session.get(Workspace, project.workspace_id)
    if not workspace or workspace.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return content


@router.get("/")
def list_contents(project_id: Optional[int] = None, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    query = select(Content).join(Project).join(Workspace).where(Workspace.owner_id == user.id)
    if project_id:
        query = query.where(Content.project_id == project_id)
    items = session.exec(query).all()
    return items


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_content(req: ContentCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    check_project_ownership(req.project_id, user.id, session)
    slug = f"{req.title.lower().strip().replace(' ', '-')}-{uuid.uuid4().hex[:8]}"
    content = Content(
        project_id=req.project_id,
        title=req.title,
        slug=slug,
        content_type=req.content_type,
        body_text=req.body_text,
        is_published=req.is_published
    )
    session.add(content)
    session.commit()
    session.refresh(content)
    return content


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_content_file(
    project_id: int = Form(...),
    title: str = Form(...),
    content_type: ContentType = Form(...),
    is_published: bool = Form(False),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    check_project_ownership(project_id, user.id, session)

    file_extension = os.path.splitext(file.filename or "")[1].lower()
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    file_url = f"/uploads/{unique_filename}"
    slug = f"{title.lower().strip().replace(' ', '-')}-{uuid.uuid4().hex[:8]}"

    # Optional: for text or markdown files, extract body text for fast preview/search
    body_text = None
    if content_type in (ContentType.MARKDOWN, ContentType.TEXT, ContentType.CODE):
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                body_text = f.read(50000)
        except Exception:
            pass

    content = Content(
        project_id=project_id,
        title=title,
        slug=slug,
        content_type=content_type,
        body_text=body_text,
        file_url=file_url,
        file_name=file.filename,
        file_size=file_size,
        mime_type=file.content_type,
        is_published=is_published
    )
    session.add(content)
    session.commit()
    session.refresh(content)
    return content


@router.get("/{id}")
def get_content(id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    content = check_content_ownership(id, user.id, session)
    return content


@router.put("/{id}")
def update_content(id: int, req: ContentUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    content = check_content_ownership(id, user.id, session)
    if req.title is not None:
        content.title = req.title
    if req.body_text is not None:
        content.body_text = req.body_text
    if req.is_published is not None:
        content.is_published = req.is_published
    content.updated_at = datetime.utcnow()
    session.add(content)
    session.commit()
    session.refresh(content)
    return content


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    content = check_content_ownership(id, user.id, session)
    if content.file_url and content.file_url.startswith("/uploads/"):
        disk_path = os.path.join(UPLOAD_DIR, os.path.basename(content.file_url))
        if os.path.exists(disk_path):
            try:
                os.remove(disk_path)
            except OSError:
                pass
    session.delete(content)
    session.commit()
    return None


@router.get("/{id}/download")
def download_content(id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    content = check_content_ownership(id, user.id, session)
    if not content.file_url:
        raise HTTPException(status_code=400, detail="Content has no file attachment")
    disk_path = os.path.join(UPLOAD_DIR, os.path.basename(content.file_url))
    if not os.path.exists(disk_path):
        raise HTTPException(status_code=404, detail="File on disk not found")
    return FileResponse(
        path=disk_path,
        filename=content.file_name or "download",
        media_type=content.mime_type or "application/octet-stream"
    )
