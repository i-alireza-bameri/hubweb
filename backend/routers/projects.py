from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from database import get_session
from models import User, Workspace, Project, Content
from auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    workspace_id: int
    name: str
    description: Optional[str] = None
    is_published: bool = False


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_published: Optional[bool] = None


@router.get("/")
def list_projects(workspace_id: Optional[int] = None, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    query = select(Project).join(Workspace).where(Workspace.owner_id == user.id)
    if workspace_id:
        query = query.where(Project.workspace_id == workspace_id)
    projects = session.exec(query).all()
    return [
        {
            "id": p.id,
            "workspace_id": p.workspace_id,
            "name": p.name,
            "slug": p.slug,
            "description": p.description,
            "is_published": p.is_published,
            "contents_count": len(p.contents),
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat()
        }
        for p in projects
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_project(req: ProjectCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    w = session.get(Workspace, req.workspace_id)
    if not w or w.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Workspace not found or unauthorized")
    slug = req.name.lower().strip().replace(" ", "-")
    p = Project(
        workspace_id=req.workspace_id,
        name=req.name,
        slug=slug,
        description=req.description,
        is_published=req.is_published
    )
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


@router.get("/{id}")
def get_project(id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    p = session.get(Project, id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    w = session.get(Workspace, p.workspace_id)
    if not w or w.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return {
        "id": p.id,
        "workspace_id": p.workspace_id,
        "name": p.name,
        "slug": p.slug,
        "description": p.description,
        "is_published": p.is_published,
        "contents": [
            {
                "id": c.id,
                "title": c.title,
                "slug": c.slug,
                "content_type": c.content_type.value if hasattr(c.content_type, "value") else str(c.content_type),
                "file_name": c.file_name,
                "file_size": c.file_size,
                "mime_type": c.mime_type,
                "is_published": c.is_published,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat()
            }
            for c in p.contents
        ],
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat()
    }


@router.put("/{id}")
def update_project(id: int, req: ProjectUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    p = session.get(Project, id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    w = session.get(Workspace, p.workspace_id)
    if not w or w.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if req.name is not None:
        p.name = req.name
        p.slug = req.name.lower().strip().replace(" ", "-")
    if req.description is not None:
        p.description = req.description
    if req.is_published is not None:
        p.is_published = req.is_published
    p.updated_at = datetime.utcnow()
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    p = session.get(Project, id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    w = session.get(Workspace, p.workspace_id)
    if not w or w.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    session.delete(p)
    session.commit()
    return None
