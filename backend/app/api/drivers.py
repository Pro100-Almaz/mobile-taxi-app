"""
Drivers API endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.services.driver_generator import DriverGeneratorService

router = APIRouter()

# Global driver service instance
driver_service = DriverGeneratorService()


@router.get("/")
async def get_drivers():
    """Get all drivers"""
    try:
        return {
            "drivers": driver_service.drivers,
            "total": len(driver_service.drivers)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching drivers: {str(e)}")


@router.get("/{driver_id}")
async def get_driver(driver_id: str):
    """Get driver by ID"""
    driver = driver_service.get_driver_by_id(driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.get("/online")
async def get_online_drivers():
    """Get online drivers only"""
    online_drivers = driver_service.get_online_drivers()
    return {
        "drivers": online_drivers,
        "total": len(online_drivers)
    }


@router.post("/generate")
async def generate_new_driver():
    """Generate a new random driver"""
    try:
        new_driver = await driver_service.add_new_driver()
        return {"success": True, "driver": new_driver}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating driver: {str(e)}")


@router.get("/stats")
async def get_driver_stats():
    """Get driver generation statistics"""
    return driver_service.get_stats()
