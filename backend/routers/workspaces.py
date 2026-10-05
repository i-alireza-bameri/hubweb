from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from database import get_session
from models import User, Workspace, Project, Content
from auth import get_current_user

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.get("/")
def list_workspaces(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    stmt = select(Workspace).where(Workspace.owner_id == user.id)
    workspaces = session.exec(stmt).all()
    results = []
    for w in workspaces:
        p_count = len(w.projects)
        results.append({
            "id": w.id,
            "name": w.name,
            "slug": w.slug,
            "description": w.description,
            "owner_id": w.owner_id,
            "projects_count": p_count,
            "created_at": w.created_at.isoformat(),
            "updated_at": w.updated_at.isoformat()
        })
    return results


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_workspace(req: WorkspaceCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    slug = req.name.lower().strip().replace(" ", "-")
    w = Workspace(name=req.name, slug=slug, description=req.description, owner_id=user.id)
    session.add(w)
    session.commit()
    session.refresh(w)
    return w


@router.get("/{id}")
def get_workspace(id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    w = session.get(Workspace, id)
    if not w or w.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return {
        "id": w.id,
        "name": w.name,
        "slug": w.slug,
        "description": w.description,
        "owner_id": w.owner_id,
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "is_published": p.is_published,
                "contents_count": len(p.contents),
                "created_at": p.created_at.isoformat()
            }
            for p in w.projects
        ],
        "created_at": w.created_at.isoformat(),
        "updated_at": w.updated_at.isoformat()
    }


@router.put("/{id}")
def update_workspace(id: int, req: WorkspaceUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    w = session.get(Workspace, id)
    if not w or w.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if req.name is not None:
        w.name = req.name
        w.slug = req.name.lower().strip().replace(" ", "-")
    if req.description is not None:
        w.description = req.description
    w.updated_at = datetime.utcnow()
    session.add(w)
    session.commit()
    session.refresh(w)
    return w


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    w = session.get(Workspace, id)
    if not w or w.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    session.delete(w)
    session.commit()
    return None
