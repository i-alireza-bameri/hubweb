import os
from typing import Generator
from sqlmodel import SQLModel, create_engine, Session

# SQLite by default, easily overridden by setting DATABASE_URL for PostgreSQL
# e.g., postgresql://user:password@localhost:5432/omnispace
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./omnispace.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "False").lower() in ("true", "1"),
    connect_args=connect_args
)

def init_db() -> None:
    """Create all SQLModel tables in database if they do not exist."""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """Dependency for yielding SQLModel database sessions."""
    with Session(engine) as session:
        yield session
