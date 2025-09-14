# 🚕 Taxi Backend Services

A comprehensive backend system for a taxi application built with FastAPI, featuring WebSocket communication and driver management.

## 📁 Project Structure

```
backend/
├── docker-compose.yml          # Docker Compose configuration
├── nginx.conf                  # Nginx reverse proxy configuration
├── geo_locations_astana_hackathon  # Astana GPS coordinates data
└── services/
    ├── websocket-service/      # WebSocket communication service
    │   ├── main.py            # FastAPI WebSocket application
    │   ├── requirements.txt    # Python dependencies
    │   └── Dockerfile         # Docker configuration
    └── driver-generator/       # Driver management service
        ├── main.py            # FastAPI driver generator
        ├── requirements.txt    # Python dependencies
        └── Dockerfile         # Docker configuration
```

## 🚀 Services Overview

### 1. WebSocket Service (`websocket-service`)
- **Port**: 8000
- **Purpose**: Handles real-time communication between clients and drivers
- **Features**:
  - WebSocket connections for live updates
  - Ride request processing and driver assignment
  - Location tracking and ETA calculations
  - Redis-based data storage
  - CORS enabled for frontend integration

### 2. Driver Generator Service (`driver-generator`)
- **Port**: 8001
- **Purpose**: Generates and manages random driver accounts
- **Features**:
  - Generates 10 random drivers with Astana locations
  - Uses GPS data from `geo_locations_astana_hackathon`
  - Kazakh names and realistic vehicle data
  - Redis-based driver state management
  - RESTful API for driver operations

### 3. Redis Database
- **Port**: 6379
- **Purpose**: Shared data store for both services
- **Usage**: User sessions, driver data, ride information

### 4. Nginx Reverse Proxy
- **Port**: 80
- **Purpose**: Load balancing and API gateway
- **Routes**:
  - `/ws/` → WebSocket service
  - `/drivers/` → Driver generator service
  - `/health` → Health check

## 🛠️ Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### 1. Clone and Navigate
```bash
cd /path/to/your/backend/directory
```

### 2. Start All Services
```bash
docker-compose up --build
```

### 3. Verify Services
```bash
# Check if services are running
curl http://localhost/health

# Check driver generator
curl http://localhost/drivers/health

# Check websocket service
curl http://localhost/ws/health
```

## 📡 API Endpoints

### WebSocket Service (Port 8000)
```bash
# Health check
GET /health

# System statistics
GET /stats

# Get ride details
GET /rides/{ride_id}
```

### Driver Generator Service (Port 8001)
```bash
# Health check
GET /health

# Get all drivers
GET /drivers

# Get specific driver
GET /drivers/{driver_id}

# Update driver location
POST /drivers/{driver_id}/location?lat={lat}&lng={lng}

# Update driver status
POST /drivers/{driver_id}/status?status={online|offline}

# Get online drivers
GET /drivers/online

# Regenerate all drivers
POST /drivers/regenerate

# Get driver statistics
GET /stats
```

## 🔧 Configuration

### Environment Variables
```bash
# WebSocket Service
REDIS_URL=redis://redis:6379
DRIVER_SERVICE_URL=http://driver-generator:8001

# Driver Generator Service
REDIS_URL=redis://redis:6379
```

### Data Source
- **File**: `geo_locations_astana_hackathon`
- **Format**: CSV with columns: `randomized_id,lat,lng,alt,spd,azm`
- **Usage**: Random location selection for driver generation
- **Location**: Kazakhstan, Astana region

## 🔌 WebSocket Events

### Client → Server
```javascript
// Initial connection
{
  "userId": "client_123",
  "role": "client"
}

// Location update
{
  "type": "updateLocation",
  "lat": 51.505,
  "lng": -0.09
}

// Ride request
{
  "type": "requestRide",
  "rideId": "ride_123",
  "userId": "client_123",
  "pickupLocation": [51.505, -0.09],
  "destinationLocation": [51.515, -0.08],
  "location": [51.505, -0.09]
}

// Ride acceptance/rejection
{
  "type": "acceptRide",
  "rideId": "ride_123",
  "driverId": "driver_001",
  "clientId": "client_123"
}
```

### Server → Client
```javascript
// Ride accepted (triggers modal!)
{
  "type": "rideAccepted",
  "data": {
    "rideId": "ride_123",
    "driverId": "driver_001",
    "driverName": "Aizhan Beketov",
    "driverLocation": [51.507, -0.08],
    "vehicleType": "sedan",
    "licensePlate": "123ABC456",
    "pickupLocation": [51.505, -0.09],
    "destinationLocation": [51.515, -0.08],
    "acceptedAt": "2024-01-01T12:00:00.000Z",
    "estimatedArrivalTime": {
      "distance": 2.5,
      "estimatedMinutes": 8,
      "estimatedArrival": "2024-01-01T12:08:00.000Z"
    }
  }
}
```

## 🎯 Driver Generation

### Features
- **10 Random Drivers**: Generated on startup
- **Kazakh Names**: Authentic local names
- **Vehicle Variety**: Sedan, SUV, hatchback, minivan, coupe
- **Real Locations**: Uses Astana GPS coordinates
- **Ratings**: 4.0-5.0 star ratings
- **Experience**: 50-1000 total rides

### Sample Driver Data
```json
{
  "driverId": "driver_001",
  "name": "Aizhan Beketov",
  "vehicleType": "sedan",
  "licensePlate": "123ABC456",
  "location": [51.09546, 71.42753],
  "status": "offline",
  "rating": 4.7,
  "totalRides": 245
}
```

## 🧪 Testing

### 1. Manual Testing
```bash
# Start services
docker-compose up

# In another terminal, test endpoints
curl http://localhost/drivers
curl http://localhost/ws/health
```

### 2. Frontend Integration
Update your frontend Socket.IO URL to:
```javascript
const socket = io('http://localhost');
```

### 3. WebSocket Testing
```javascript
// Connect to WebSocket
const socket = io('http://localhost/ws', {
  transports: ['websocket']
});

// Send test data
socket.emit('test', { message: 'Hello Backend!' });
```

## 📊 Monitoring

### Health Checks
- **Overall**: `http://localhost/health`
- **WebSocket**: `http://localhost/ws/health`
- **Drivers**: `http://localhost/drivers/health`

### Logs
```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs websocket-service
docker-compose logs driver-generator
docker-compose logs redis
```

## 🔄 Scaling

### Horizontal Scaling
```yaml
# Add multiple instances
websocket-service:
  scale: 3
  ...

driver-generator:
  scale: 2
  ...
```

### Load Balancing
Nginx automatically distributes requests across scaled instances.

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using ports
   lsof -i :8000
   lsof -i :8001
   lsof -i :6379
   ```

2. **Redis Connection Issues**
   ```bash
   # Check Redis status
   docker-compose exec redis redis-cli ping
   ```

3. **Service Dependencies**
   ```bash
   # Restart specific service
   docker-compose restart websocket-service
   ```

### Debug Mode
```bash
# Run with debug logs
docker-compose up --build --verbose
```

## 📈 Performance

- **Redis**: In-memory data storage for fast access
- **WebSocket**: Real-time communication with low latency
- **Docker**: Containerized services for consistent deployment
- **Nginx**: Efficient reverse proxy and load balancing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Astana Taxi Hackathon. See LICENSE file for details.
