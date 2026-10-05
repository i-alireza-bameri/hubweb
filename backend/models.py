import enum
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class ContentType(str, enum.Enum):
    MARKDOWN = "markdown"
    CODE = "code"
    TEXT = "text"
    IMAGE = "image"
    PDF = "pdf"
    VIDEO = "video"
    WORD = "word"
    EXCEL = "excel"


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    full_name: Optional[str] = None


class User(UserBase, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    workspaces: List["Workspace"] = Relationship(back_populates="owner", cascade_delete=True)


class WorkspaceBase(SQLModel):
    name: str = Field(index=True)
    slug: str = Field(index=True)
    description: Optional[str] = None


class Workspace(WorkspaceBase, table=True):
    __tablename__ = "workspaces"

    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    owner: Optional[User] = Relationship(back_populates="workspaces")
    projects: List["Project"] = Relationship(back_populates="workspace", cascade_delete=True)


class ProjectBase(SQLModel):
    name: str = Field(index=True)
    slug: str = Field(index=True)
    description: Optional[str] = None
    is_published: bool = Field(default=False)


class Project(ProjectBase, table=True):
    __tablename__ = "projects"

    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspaces.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    workspace: Optional[Workspace] = Relationship(back_populates="projects")
    contents: List["Content"] = Relationship(back_populates="project", cascade_delete=True)


class ContentBase(SQLModel):
    title: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    content_type: ContentType = Field(default=ContentType.MARKDOWN)
    body_text: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    is_published: bool = Field(default=False, index=True)


class Content(ContentBase, table=True):
    __tablename__ = "contents"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    project: Optional[Project] = Relationship(back_populates="contents")
