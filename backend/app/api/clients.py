"""
Clients API endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

router = APIRouter()

# In-memory client storage (in production, use database)
clients: Dict[str, Dict[str, Any]] = {}


@router.post("/connect")
async def connect_client(client_data: Dict[str, Any]):
    """Connect/register a new client"""
    try:
        client_id = client_data.get("clientId")
        if not client_id:
            raise HTTPException(status_code=400, detail="clientId is required")

        # Create or update client
        clients[client_id] = {
            **client_data,
            "connectedAt": "now",
            "status": "active"
        }

        return {
            "success": True,
            "message": f"Client {client_id} connected successfully",
            "client": clients[client_id]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error connecting client: {str(e)}")


@router.get("/")
async def get_clients():
    """Get all connected clients"""
    return {
        "clients": list(clients.values()),
        "total": len(clients)
    }


@router.get("/{client_id}")
async def get_client(client_id: str):
    """Get client by ID"""
    if client_id not in clients:
        raise HTTPException(status_code=404, detail="Client not found")
    return clients[client_id]


@router.delete("/{client_id}")
async def disconnect_client(client_id: str):
    """Disconnect a client"""
    if client_id not in clients:
        raise HTTPException(status_code=404, detail="Client not found")

    del clients[client_id]
    return {"success": True, "message": f"Client {client_id} disconnected"}
