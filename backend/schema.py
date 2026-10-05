import strawberry
from strawberry.types import Info
from typing import Optional, List
from datetime import datetime
from sqlmodel import Session, select
from database import engine
from models import (
    User as UserModel,
    Workspace as WorkspaceModel,
    Project as ProjectModel,
    Content as ContentModel,
    ContentType as ModelContentType
)
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token
)


@strawberry.type
class UserType:
    id: int
    email: str
    username: str
    full_name: Optional[str]
    created_at: datetime


@strawberry.type
class ContentTypeGQL:
    id: int
    project_id: int
    title: str
    slug: str
    content_type: str
    body_text: Optional[str]
    file_url: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    is_published: bool
    created_at: datetime
    updated_at: datetime


@strawberry.type
class ProjectType:
    id: int
    workspace_id: int
    name: str
    slug: str
    description: Optional[str]
    is_published: bool
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    def contents(self) -> List[ContentTypeGQL]:
        with Session(engine) as session:
            stmt = select(ContentModel).where(ContentModel.project_id == self.id)
            items = session.exec(stmt).all()
            return [
                ContentTypeGQL(
                    id=c.id,
                    project_id=c.project_id,
                    title=c.title,
                    slug=c.slug,
                    content_type=c.content_type.value if hasattr(c.content_type, "value") else str(c.content_type),
                    body_text=c.body_text,
                    file_url=c.file_url,
                    file_name=c.file_name,
                    file_size=c.file_size,
                    mime_type=c.mime_type,
                    is_published=c.is_published,
                    created_at=c.created_at,
                    updated_at=c.updated_at
                )
                for c in items
            ]


@strawberry.type
class WorkspaceType:
    id: int
    name: str
    slug: str
    description: Optional[str]
    owner_id: int
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    def projects(self) -> List[ProjectType]:
        with Session(engine) as session:
            stmt = select(ProjectModel).where(ProjectModel.workspace_id == self.id)
            items = session.exec(stmt).all()
            return [
                ProjectType(
                    id=p.id,
                    workspace_id=p.workspace_id,
                    name=p.name,
                    slug=p.slug,
                    description=p.description,
                    is_published=p.is_published,
                    created_at=p.created_at,
                    updated_at=p.updated_at
                )
                for p in items
            ]


@strawberry.type
class AuthPayload:
    token: str
    user: UserType


def get_user_from_info(info: Info) -> Optional[UserModel]:
    request = info.context.get("request")
    if not request:
        return None
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    with Session(engine) as session:
        return session.get(UserModel, int(user_id))


@strawberry.type
class Query:
    @strawberry.field
    def me(self, info: Info) -> Optional[UserType]:
        user = get_user_from_info(info)
        if not user:
            return None
        return UserType(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            created_at=user.created_at
        )

    @strawberry.field
    def workspaces(self, info: Info) -> List[WorkspaceType]:
        user = get_user_from_info(info)
        if not user:
            raise Exception("Authentication required")
        with Session(engine) as session:
            stmt = select(WorkspaceModel).where(WorkspaceModel.owner_id == user.id)
            workspaces = session.exec(stmt).all()
            return [
                WorkspaceType(
                    id=w.id,
                    name=w.name,
                    slug=w.slug,
                    description=w.description,
                    owner_id=w.owner_id,
                    created_at=w.created_at,
                    updated_at=w.updated_at
                )
                for w in workspaces
            ]

    @strawberry.field
    def workspace(self, info: Info, id: int) -> Optional[WorkspaceType]:
        user = get_user_from_info(info)
        if not user:
            raise Exception("Authentication required")
        with Session(engine) as session:
            w = session.get(WorkspaceModel, id)
            if not w or w.owner_id != user.id:
                return None
            return WorkspaceType(
                id=w.id,
                name=w.name,
                slug=w.slug,
                description=w.description,
                owner_id=w.owner_id,
                created_at=w.created_at,
                updated_at=w.updated_at
            )

    @strawberry.field
    def project(self, info: Info, id: int) -> Optional[ProjectType]:
        user = get_user_from_info(info)
        with Session(engine) as session:
            p = session.get(ProjectModel, id)
            if not p:
                return None
            # Check ownership or publication
            w = session.get(WorkspaceModel, p.workspace_id)
            if not p.is_published:
                if not user or not w or w.owner_id != user.id:
                    raise Exception("Not authorized to view this project")
            return ProjectType(
                id=p.id,
                workspace_id=p.workspace_id,
                name=p.name,
                slug=p.slug,
                description=p.description,
                is_published=p.is_published,
                created_at=p.created_at,
                updated_at=p.updated_at
            )

    @strawberry.field
    def content(self, info: Info, id: int) -> Optional[ContentTypeGQL]:
        user = get_user_from_info(info)
        with Session(engine) as session:
            c = session.get(ContentModel, id)
            if not c:
                return None
            if not c.is_published:
                p = session.get(ProjectModel, c.project_id)
                w = session.get(WorkspaceModel, p.workspace_id) if p else None
                if not user or not w or w.owner_id != user.id:
                    raise Exception("Not authorized to view this content")
            return ContentTypeGQL(
                id=c.id,
                project_id=c.project_id,
                title=c.title,
                slug=c.slug,
                content_type=c.content_type.value if hasattr(c.content_type, "value") else str(c.content_type),
                body_text=c.body_text,
                file_url=c.file_url,
                file_name=c.file_name,
                file_size=c.file_size,
                mime_type=c.mime_type,
                is_published=c.is_published,
                created_at=c.created_at,
                updated_at=c.updated_at
            )

    @strawberry.field
    def public_content(self, slug: str) -> Optional[ContentTypeGQL]:
        """Publicly accessible content by slug requiring no authentication"""
        with Session(engine) as session:
            stmt = select(ContentModel).where(ContentModel.slug == slug, ContentModel.is_published == True)
            c = session.exec(stmt).first()
            if not c:
                return None
            return ContentTypeGQL(
                id=c.id,
                project_id=c.project_id,
                title=c.title,
                slug=c.slug,
                content_type=c.content_type.value if hasattr(c.content_type, "value") else str(c.content_type),
                body_text=c.body_text,
                file_url=c.file_url,
                file_name=c.file_name,
                file_size=c.file_size,
                mime_type=c.mime_type,
                is_published=c.is_published,
                created_at=c.created_at,
                updated_at=c.updated_at
            )


@strawberry.type
class Mutation:
    @strawberry.mutation
    def register(self, email: str, username: str, password: str, full_name: Optional[str] = None) -> AuthPayload:
        with Session(engine) as session:
            existing = session.exec(select(UserModel).where((UserModel.email == email) | (UserModel.username == username))).first()
            if existing:
                raise Exception("Email or username already registered")
            user = UserModel(
                email=email,
                username=username,
                full_name=full_name,
                hashed_password=get_password_hash(password)
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            token = create_access_token({"sub": str(user.id), "username": user.username})
            return AuthPayload(
                token=token,
                user=UserType(
                    id=user.id,
                    email=user.email,
                    username=user.username,
                    full_name=user.full_name,
                    created_at=user.created_at
                )
            )

    @strawberry.mutation
    def login(self, email: str, password: str) -> AuthPayload:
        with Session(engine) as session:
            user = session.exec(select(UserModel).where(UserModel.email == email)).first()
            if not user or not verify_password(password, user.hashed_password):
                raise Exception("Invalid email or password")
            token = create_access_token({"sub": str(user.id), "username": user.username})
            return AuthPayload(
                token=token,
                user=UserType(
                    id=user.id,
                    email=user.email,
                    username=user.username,
                    full_name=user.full_name,
                    created_at=user.created_at
                )
            )

    @strawberry.mutation
    def create_workspace(self, info: Info, name: str, description: Optional[str] = None) -> WorkspaceType:
        user = get_user_from_info(info)
        if not user:
            raise Exception("Authentication required")
        with Session(engine) as session:
            slug = name.lower().replace(" ", "-").replace("/", "-")
            w = WorkspaceModel(name=name, slug=slug, description=description, owner_id=user.id)
            session.add(w)
            session.commit()
            session.refresh(w)
            return WorkspaceType(
                id=w.id,
                name=w.name,
                slug=w.slug,
                description=w.description,
                owner_id=w.owner_id,
                created_at=w.created_at,
                updated_at=w.updated_at
            )

    @strawberry.mutation
    def publish_content(self, info: Info, id: int, is_published: bool) -> ContentTypeGQL:
        user = get_user_from_info(info)
        if not user:
            raise Exception("Authentication required")
        with Session(engine) as session:
            c = session.get(ContentModel, id)
            if not c:
                raise Exception("Content not found")
            p = session.get(ProjectModel, c.project_id)
            w = session.get(WorkspaceModel, p.workspace_id) if p else None
            if not w or w.owner_id != user.id:
                raise Exception("Not authorized to publish this content")
            c.is_published = is_published
            session.add(c)
            session.commit()
            session.refresh(c)
            return ContentTypeGQL(
                id=c.id,
                project_id=c.project_id,
                title=c.title,
                slug=c.slug,
                content_type=c.content_type.value if hasattr(c.content_type, "value") else str(c.content_type),
                body_text=c.body_text,
                file_url=c.file_url,
                file_name=c.file_name,
                file_size=c.file_size,
                mime_type=c.mime_type,
                is_published=c.is_published,
                created_at=c.created_at,
                updated_at=c.updated_at
            )


schema = strawberry.Schema(query=Query, mutation=Mutation)
