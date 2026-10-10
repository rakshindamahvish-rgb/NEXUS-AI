import pytest
from app.database import SessionLocal, Base, engine
from app.seed.seed_data import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Ensure database tables and demonstration seed dataset are created before tests run."""
    db = SessionLocal()
    try:
        init_db(db, force_reseed=True)
    finally:
        db.close()
    yield
