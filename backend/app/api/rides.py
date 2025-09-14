"""
Rides API endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from app.core.websocket import websocket_manager

router = APIRouter()


@router.post("/notify-driver")
async def notify_driver(ride_data: Dict[str, Any]):
    """Send ride request to available drivers"""
    try:
        result = await websocket_manager.handle_ride_request(ride_data)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error notifying driver: {str(e)}")


@router.get("/")
async def get_rides(status: Optional[str] = None, limit: int = 50):
    """Get rides with optional status filter"""
    try:
        rides = []
        all_rides = {**websocket_manager.pending_rides, **websocket_manager.accepted_rides}

        for ride_id, ride in all_rides.items():
            if not status or ride.get("status") == status:
                rides.append({
                    "rideId": ride["rideId"],
                    "clientId": ride.get("clientId"),
                    "driverId": ride.get("driverId"),
                    "status": ride["status"],
                    "pickupLocation": ride.get("pickupLocation"),
                    "destinationLocation": ride.get("destinationLocation"),
                    "createdAt": ride.get("created_at"),
                    "acceptedAt": ride.get("acceptedAt"),
                    "driver": None,  # Would be populated from driver service in production
                    "eta": None  # Would calculate ETA in production
                })

                if len(rides) >= limit:
                    break

        return {
            "rides": rides,
            "totalCount": len(rides)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching rides: {str(e)}")


@router.get("/{ride_id}")
async def get_ride(ride_id: str):
    """Get specific ride by ID"""
    all_rides = {**websocket_manager.pending_rides, **websocket_manager.accepted_rides}

    if ride_id not in all_rides:
        raise HTTPException(status_code=404, detail="Ride not found")

    ride = all_rides[ride_id]
    return {
        "rideId": ride["rideId"],
        "clientId": ride.get("clientId"),
        "driverId": ride.get("driverId"),
        "status": ride["status"],
        "pickupLocation": ride.get("pickupLocation"),
        "destinationLocation": ride.get("destinationLocation"),
        "createdAt": ride.get("created_at"),
        "acceptedAt": ride.get("acceptedAt"),
        "rejections": ride.get("rejections", [])
    }


@router.get("/stats")
async def get_ride_stats():
    """Get ride statistics"""
    stats = websocket_manager.get_connection_stats()
    return {
        "pending_rides": stats["pending_rides"],
        "active_rides": stats["active_rides"],
        "total_rides": stats["pending_rides"] + stats["active_rides"]
    }
