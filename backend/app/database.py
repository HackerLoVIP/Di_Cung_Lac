from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Thu ket noi PostgreSQL, neu chua co server thi tu dong fallback sang SQLite local
db_url = settings.DATABASE_URL
connect_args = {}

if "sqlite" in db_url:
    connect_args = {"check_same_thread": False}

try:
    if "postgres" in db_url:
        import psycopg2
        # Test ket noi nhanh
        test_conn = psycopg2.connect(db_url, connect_timeout=2)
        test_conn.close()
        engine = create_engine(db_url, pool_pre_ping=True)
        print(" Connected to PostgreSQL database successfully.")
    else:
        engine = create_engine(db_url, connect_args=connect_args)
except Exception:
    print(" PostgreSQL server not found on port 5432. Falling back to local SQLite database: ./dicunglac.db")
    db_url = "sqlite:///./dicunglac.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency cung cap session ket noi CSDL cho FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
