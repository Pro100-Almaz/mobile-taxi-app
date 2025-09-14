"""
Taxi App Backend - FastAPI WebSocket Service
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api.websocket import router as websocket_router
from app.api.drivers import router as drivers_router
from app.api.clients import router as clients_router
from app.api.rides import router as rides_router
from app.core.config import settings
from app.core.websocket import websocket_manager
from app.services.driver_generator import DriverGeneratorService

# Initialize FastAPI app
app = FastAPI(
    title="Taxi App Backend",
    description="Real-time taxi booking system with WebSocket support",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(websocket_router, prefix="/ws", tags=["websocket"])
app.include_router(drivers_router, prefix="/api/drivers", tags=["drivers"])
app.include_router(clients_router, prefix="/api/clients", tags=["clients"])
app.include_router(rides_router, prefix="/api/rides", tags=["rides"])

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Initialize WebSocket manager
    await websocket_manager.startup()

    # Initialize driver generator service
    driver_service = DriverGeneratorService()
    await driver_service.initialize_drivers()

    print("🚀 Taxi App Backend started successfully!")
    print("📊 WebSocket service ready")
    print("🚗 Driver generation service ready")
    print("📚 API docs available at: http://localhost:8000/docs")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await websocket_manager.shutdown()
    print("👋 Taxi App Backend shut down")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "taxi-app-backend",
        "websocket_connections": len(websocket_manager.active_connections)
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
