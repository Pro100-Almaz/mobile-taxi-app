"""
WebSocket API endpoints for real-time communication
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any
import json
import logging

from app.core.websocket import websocket_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    user_id = None
    user_type = None

    try:
        # Wait for initial connection message with user info
        initial_data = await websocket.receive_json()
        user_id = initial_data.get("userId")
        user_type = initial_data.get("userType")

        if not user_id or not user_type:
            await websocket.send_json({
                "type": "error",
                "message": "userId and userType required for connection"
            })
            await websocket.close()
            return

        # Connect user to WebSocket manager
        await websocket_manager.connect_user(user_id, user_type, websocket)

        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": f"Connected as {user_type}: {user_id}",
            "timestamp": "now"
        })

        logger.info(f"WebSocket connection established for {user_type}: {user_id}")

        # Handle incoming messages
        while True:
            try:
                data = await websocket.receive_json()
                message_type = data.get("type")

                if message_type == "updateLocation":
                    # Handle location updates
                    response = {"type": "locationUpdated", "success": True}
                    await websocket.send_json(response)

                elif message_type == "requestRide":
                    # Handle ride requests
                    result = await websocket_manager.handle_ride_request(data)
                    await websocket.send_json(result)

                elif message_type == "acceptRide":
                    # Handle ride acceptance
                    result = await websocket_manager.handle_ride_acceptance(data)
                    await websocket.send_json(result)

                elif message_type == "rejectRide":
                    # Handle ride rejection
                    result = await websocket_manager.handle_ride_rejection(data)
                    await websocket.send_json(result)

                elif message_type == "cancelRide":
                    # Handle ride cancellation
                    result = await websocket_manager.handle_ride_cancellation(data)
                    await websocket.send_json(result)

                elif message_type == "heartbeat":
                    # Respond to heartbeat
                    await websocket.send_json({"type": "heartbeat", "timestamp": "now"})

                else:
                    await websocket.send_json({
                        "type": "unknown_command",
                        "message": f"Unknown command: {message_type}"
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user: {user_id}")

    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")

    finally:
        # Clean up connection
        if user_id:
            await websocket_manager.disconnect_user(user_id)


@router.get("/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    return websocket_manager.get_connection_stats()
