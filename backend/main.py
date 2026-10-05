import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from strawberry.fastapi import GraphQLRouter

from database import init_db
from schema import schema
from routers import (
    auth as auth_router,
    workspaces as workspaces_router,
    projects as projects_router,
    contents as contents_router,
    public as public_router
)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite or PostgreSQL database tables on startup
    init_db()
    yield


app = FastAPI(
    title="OmniSpace API",
    description="Full-stack Workspace, Project & Content Management with FastAPI, SQLModel, Strawberry GraphQL, and JWT Auth",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Strawberry Context Getter for passing Request (for Auth Header inspection)
async def get_graphql_context(request: Request):
    return {"request": request}

# Mount Strawberry GraphQL router
graphql_app = GraphQLRouter(schema, context_getter=get_graphql_context)
app.include_router(graphql_app, prefix="/graphql")

# Mount REST API Routers
app.include_router(auth_router.router)
app.include_router(workspaces_router.router)
app.include_router(projects_router.router)
app.include_router(contents_router.router)
app.include_router(public_router.router)

# Mount static uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "omnispace-api",
        "framework": "FastAPI + SQLModel + Strawberry GraphQL"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
