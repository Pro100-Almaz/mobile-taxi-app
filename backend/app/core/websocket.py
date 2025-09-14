"""
WebSocket connection manager for real-time communication
"""
from typing import Dict, List, Set
import asyncio
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections and real-time communication"""

    def __init__(self):
        self.active_connections: Dict[str, dict] = {}  # user_id -> connection_info
        self.driver_connections: Set[str] = set()
        self.client_connections: Set[str] = set()
        self.pending_rides: Dict[str, dict] = {}
        self.accepted_rides: Dict[str, dict] = {}

    async def startup(self):
        """Initialize the WebSocket manager"""
        logger.info("WebSocket manager initialized")
        # Start periodic cleanup task
        asyncio.create_task(self._periodic_cleanup())

    async def shutdown(self):
        """Shutdown the WebSocket manager"""
        logger.info("WebSocket manager shutting down")
        # Broadcast shutdown message to all clients
        await self.broadcast_to_all({
            "type": "server_shutdown",
            "message": "Server is shutting down",
            "timestamp": datetime.utcnow().isoformat()
        })

    async def _periodic_cleanup(self):
        """Periodic cleanup of stale connections"""
        while True:
            try:
                # Clean up stale connections (implement based on your needs)
                current_time = datetime.utcnow().timestamp()

                # Remove connections older than 5 minutes (example)
                stale_threshold = 300  # 5 minutes

                stale_connections = []
                for user_id, conn_info in self.active_connections.items():
                    if current_time - conn_info.get('last_seen', 0) > stale_threshold:
                        stale_connections.append(user_id)

                for user_id in stale_connections:
                    await self.disconnect_user(user_id)

                logger.debug(f"Cleaned up {len(stale_connections)} stale connections")

            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}")

            await asyncio.sleep(60)  # Run every minute

    async def connect_user(self, user_id: str, user_type: str, websocket) -> dict:
        """Connect a new user"""
        connection_info = {
            "user_id": user_id,
            "user_type": user_type,
            "websocket": websocket,
            "connected_at": datetime.utcnow().isoformat(),
            "last_seen": datetime.utcnow().timestamp()
        }

        self.active_connections[user_id] = connection_info

        if user_type == "driver":
            self.driver_connections.add(user_id)
        elif user_type == "client":
            self.client_connections.add(user_id)

        logger.info(f"User {user_id} ({user_type}) connected. Total connections: {len(self.active_connections)}")

        return connection_info

    async def disconnect_user(self, user_id: str):
        """Disconnect a user"""
        if user_id in self.active_connections:
            conn_info = self.active_connections[user_id]

            # Remove from type-specific sets
            if conn_info["user_type"] == "driver":
                self.driver_connections.discard(user_id)
            elif conn_info["user_type"] == "client":
                self.client_connections.discard(user_id)

            # Close WebSocket if still open
            try:
                websocket = conn_info.get("websocket")
                if websocket:
                    await websocket.close()
            except Exception as e:
                logger.warning(f"Error closing websocket for {user_id}: {e}")

            # Remove from active connections
            del self.active_connections[user_id]

            logger.info(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")

    async def send_to_user(self, user_id: str, message: dict):
        """Send message to specific user"""
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]["websocket"]
                await websocket.send_json(message)
                self.active_connections[user_id]["last_seen"] = datetime.utcnow().timestamp()
                return True
            except Exception as e:
                logger.error(f"Error sending message to {user_id}: {e}")
                # Remove broken connection
                await self.disconnect_user(user_id)
                return False
        return False

    async def broadcast_to_type(self, user_type: str, message: dict):
        """Broadcast message to all users of specific type"""
        targets = []
        if user_type == "driver":
            targets = list(self.driver_connections)
        elif user_type == "client":
            targets = list(self.client_connections)
        else:
            targets = list(self.active_connections.keys())

        sent_count = 0
        for user_id in targets:
            if await self.send_to_user(user_id, message):
                sent_count += 1

        logger.debug(f"Broadcasted to {sent_count}/{len(targets)} {user_type} users")

    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all connected users"""
        sent_count = 0
        for user_id in list(self.active_connections.keys()):
            if await self.send_to_user(user_id, message):
                sent_count += 1

        logger.debug(f"Broadcasted to {sent_count}/{len(self.active_connections)} total users")

    async def handle_ride_request(self, ride_data: dict):
        """Handle new ride request from client"""
        ride_id = ride_data.get("rideId")
        client_id = ride_data.get("userId")

        if not ride_id or not client_id:
            return {"error": "Missing rideId or userId"}

        # Store pending ride
        self.pending_rides[ride_id] = {
            **ride_data,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }

        # Broadcast to all available drivers
        await self.broadcast_to_type("driver", {
            "type": "rideRequest",
            "rideId": ride_id,
            "userId": client_id,
            "pickup": f"{ride_data.get('pickupLocation', [0, 0])[0]:.4f}, {ride_data.get('pickupLocation', [0, 0])[1]:.4f}",
            "destination": f"{ride_data.get('destinationLocation', [0, 0])[0]:.4f}, {ride_data.get('destinationLocation', [0, 0])[1]:.4f}",
            "location": ride_data.get("pickupLocation"),
            "timestamp": datetime.utcnow().isoformat()
        })

        logger.info(f"Ride {ride_id} requested by client {client_id}")
        return {"success": True, "rideId": ride_id}

    async def handle_ride_acceptance(self, acceptance_data: dict):
        """Handle ride acceptance by driver"""
        ride_id = acceptance_data.get("rideId")
        driver_id = acceptance_data.get("driverId")
        client_id = acceptance_data.get("clientId")

        if not ride_id or not driver_id or not client_id:
            return {"error": "Missing required fields"}

        # Update ride status
        if ride_id in self.pending_rides:
            ride = self.pending_rides[ride_id]
            ride["status"] = "accepted"
            ride["driverId"] = driver_id
            ride["acceptedAt"] = datetime.utcnow().isoformat()

            # Move to accepted rides
            self.accepted_rides[ride_id] = ride
            del self.pending_rides[ride_id]

            # Calculate ETA (simplified)
            eta = {
                "distance": 2.5,  # km
                "estimatedMinutes": 8,
                "estimatedArrival": (datetime.utcnow().timestamp() + 480) * 1000  # 8 minutes from now
            }

            # Notify client
            await self.send_to_user(client_id, {
                "type": "rideAccepted",
                "rideId": ride_id,
                "driverId": driver_id,
                "driverName": f"Driver {driver_id[:8]}",
                "driverLocation": ride.get("pickupLocation"),
                "vehicleType": "sedan",
                "licensePlate": "AUTO001",
                "pickupLocation": ride.get("pickupLocation"),
                "destinationLocation": ride.get("destinationLocation"),
                "acceptedAt": ride["acceptedAt"],
                "estimatedArrivalTime": eta
            })

            # Notify driver
            await self.send_to_user(driver_id, {
                "type": "rideAssigned",
                "rideId": ride_id,
                "clientId": client_id,
                "pickupLocation": ride.get("pickupLocation"),
                "destinationLocation": ride.get("destinationLocation"),
                "acceptedAt": ride["acceptedAt"]
            })

            logger.info(f"Ride {ride_id} accepted by driver {driver_id}")
            return {"success": True, "rideId": ride_id, "eta": eta}

        return {"error": "Ride not found"}

    async def handle_ride_rejection(self, rejection_data: dict):
        """Handle ride rejection by driver"""
        ride_id = rejection_data.get("rideId")
        driver_id = rejection_data.get("driverId")

        if not ride_id or not driver_id:
            return {"error": "Missing rideId or driverId"}

        # Update ride status
        if ride_id in self.pending_rides:
            ride = self.pending_rides[ride_id]
            # Add rejection tracking
            if not ride.get("rejections"):
                ride["rejections"] = []
            ride["rejections"].append({
                "driverId": driver_id,
                "rejectedAt": datetime.utcnow().isoformat(),
                "reason": rejection_data.get("reason", "driver_rejected")
            })

            # Check if ride has too many rejections
            if len(ride["rejections"]) >= 3:  # Cancel after 3 rejections
                ride["status"] = "cancelled"
                del self.pending_rides[ride_id]

                # Notify client
                client_id = ride.get("clientId")
                if client_id:
                    await self.send_to_user(client_id, {
                        "type": "rideCancelled",
                        "rideId": ride_id,
                        "reason": "too_many_rejections",
                        "message": "Your ride has been cancelled due to multiple driver rejections."
                    })

                logger.info(f"Ride {ride_id} cancelled due to multiple rejections")
            else:
                logger.info(f"Ride {ride_id} rejected by driver {driver_id}")

            return {"success": True, "message": "Ride rejection recorded"}

        return {"error": "Ride not found"}

    async def handle_ride_cancellation(self, cancellation_data: dict):
        """Handle ride cancellation by client"""
        ride_id = cancellation_data.get("rideId")
        user_id = cancellation_data.get("userId")

        if not ride_id or not user_id:
            return {"error": "Missing rideId or userId"}

        # Remove from pending rides
        if ride_id in self.pending_rides:
            ride = self.pending_rides[ride_id]
            if ride.get("clientId") == user_id:
                del self.pending_rides[ride_id]

                # Notify all drivers about cancellation
                await self.broadcast_to_type("driver", {
                    "type": "rideCancelled",
                    "rideId": ride_id,
                    "reason": "client_cancelled"
                })

                logger.info(f"Ride {ride_id} cancelled by client {user_id}")
                return {"success": True, "message": "Ride cancelled successfully"}

        return {"error": "Ride not found or not authorized"}

    def get_connection_stats(self) -> dict:
        """Get connection statistics"""
        return {
            "total_connections": len(self.active_connections),
            "driver_connections": len(self.driver_connections),
            "client_connections": len(self.client_connections),
            "pending_rides": len(self.pending_rides),
            "active_rides": len(self.accepted_rides)
        }


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
