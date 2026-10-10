import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import SessionLocal, engine, Base
from app.seed.seed_data import init_db

from app.api.routes_network import router as network_router
from app.api.routes_simulation import router as simulation_router
from app.api.routes_agents import router as agents_router
from app.api.routes_benchmarks import router as benchmarks_router
from app.api.routes_governance import router as governance_router
from app.api.routes_data import router as data_router
from app.api.routes_settings import router as settings_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexus")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and demonstration dataset
    db = SessionLocal()
    try:
        init_db(db, force_reseed=False)
        logger.info("NEXUS database initialized and verified.")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="NEXUS — AI Supply Chain Future Simulation & Resilience Engine Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(network_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(agents_router, prefix=settings.API_V1_STR)
app.include_router(benchmarks_router, prefix=settings.API_V1_STR)
app.include_router(governance_router, prefix=settings.API_V1_STR)
app.include_router(data_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "documentation": "/docs",
        "synthetic_notice": settings.SYNTHETIC_DATA_BANNER
    }
