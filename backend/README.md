# Taxi App Backend

Socket.IO server for the taxi booking application with real-time communication between drivers and clients.

## Features

- **Real-time Location Tracking**: Track driver and client locations in real-time
- **Ride Management**: Handle ride requests, acceptances, rejections, and completions
- **Driver Availability**: Manage online/offline status of drivers
- **Cross-Origin Support**: CORS enabled for frontend connections
- **Health Monitoring**: Basic health check endpoint

## Tech Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Real-time Communication**: Socket.IO with multiple namespaces
- **API Documentation**: Swagger/OpenAPI with swagger-jsdoc and swagger-ui-express
- **CORS**: Enabled for cross-origin requests

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### REST API Endpoints

#### Health Check
- **GET** `/health`
- Returns server status and statistics

#### Drivers Management
- **GET** `/api/drivers`
- Returns all available drivers with their current locations
- Useful for external services to calculate distances and assign optimal drivers

- **POST** `/api/drivers/connect`
- Connect/register a driver with location and status
- Useful for driver onboarding and initial setup

- **GET** `/api/drivers/{driverId}`
- Get detailed information about a specific driver
- Includes location, status, vehicle details, and timestamps

- **PUT** `/api/drivers/{driverId}/location`
- Update a driver's location coordinates
- Alternative to WebSocket location updates

#### Ride Notifications
- **POST** `/api/rides/notify-driver`
- Send ride notification to a specific driver
- Useful for spawning random riders and assigning to most suitable driver

#### API Documentation
- **GET** `/api-docs`
- Interactive Swagger/OpenAPI documentation for all endpoints

## Socket.IO Events

### Client → Server Events

#### Location Updates
```javascript
socket.emit('updateLocation', {
  userId: 'client_123',
  lat: 51.505,
  lng: -0.09,
  role: 'client' // or 'driver'
})
```

#### Ride Requests
```javascript
socket.emit('requestRide', {
  rideId: 'ride_123',
  userId: 'client_123',
  pickupLocation: [51.505, -0.09],
  destinationLocation: [51.515, -0.08],
  location: [51.505, -0.09]
})
```

#### Ride Cancellation
```javascript
socket.emit('cancelRide', {
  rideId: 'ride_123',
  userId: 'client_123'
})
```

### Driver → Server Events

#### Driver Status
```javascript
// Go online
socket.emit('driverOnline', { userId: 'driver_456' })

// Go offline
socket.emit('driverOffline', { userId: 'driver_456' })
```

#### Ride Actions
```javascript
// Accept ride
socket.emit('acceptRide', {
  rideId: 'ride_123',
  driverId: 'driver_456',
  clientId: 'client_123'
})

// Reject ride
socket.emit('rejectRide', {
  rideId: 'ride_123',
  driverId: 'driver_456'
})

// Complete ride
socket.emit('completeRide', {
  rideId: 'ride_123',
  driverId: 'driver_456',
  clientId: 'client_123'
})
```

### Server → Client Events

#### Ride Notifications
```javascript
// New ride request (to drivers)
socket.on('rideRequest', (data) => {
  // data: { id, userId, pickup, destination, location }
})

// Ride accepted (to client)
socket.on('rideAccepted', (data) => {
  // data: { rideId, driverId }
})

// Ride completed (to client)
socket.on('rideCompleted', () => {
  // Ride finished
})

// Ride cancelled (to drivers)
socket.on('rideCancelled', (data) => {
  // data: { rideId }
})
```

#### Location Updates
```javascript
// Other users' location updates
socket.on('userLocationUpdate', (data) => {
  // data: { userId, location: { lat, lng }, role }
})

// Available drivers list
socket.on('driversAvailable', (drivers) => {
  // drivers: array of driver IDs
})
```

## WebSocket Namespaces

### Main Namespace (/)
For client and driver applications connecting to the taxi service.

### External Services Namespace (/external)
Dedicated namespace for external monitoring and integration services:

#### Server → External Service Events
```javascript
// Initial data when connecting
socket.on('initialData', (data) => {
  // data: { drivers: [...], pendingRides: [...] }
})

// Real-time driver location updates
socket.on('driverLocationUpdate', (data) => {
  // data: { driverId, location: { lat, lng }, lastUpdate }
})

// Driver status changes
socket.on('driverStatusChange', (data) => {
  // data: { driverId, status: 'online'|'offline', timestamp }
})

// New ride requests
socket.on('rideCreated', (data) => {
  // data: { rideId, clientId, pickupLocation, destinationLocation, ... }
})

// Ride accepted
socket.on('rideAccepted', (data) => {
  // data: { rideId, driverId, clientId, ... }
})

// Ride completed
socket.on('rideCompleted', (data) => {
  // data: { rideId, driverId, clientId, completedAt }
})
```

#### External Service → Server Events
```javascript
// Request specific driver location
socket.emit('requestDriverLocation', { driverId: 'driver_123' })

// Response
socket.on('driverLocation', (data) => {
  // data: { driverId, location: { lat, lng }, lastUpdate }
})

socket.on('driverNotFound', (data) => {
  // data: { driverId }
})
```

## Architecture

- **Connected Users**: Map storing all connected users with their socket IDs and locations
- **Active Drivers**: Set of currently online drivers
- **Pending Rides**: Map of ride requests waiting for driver acceptance
- **Real-time Communication**: All ride operations happen in real-time via WebSocket
- **External Services**: Dedicated WebSocket namespace for monitoring and integration services
- **REST API**: Additional HTTP endpoints for external service integration

## Development

The server includes comprehensive logging for debugging:
- User connections/disconnections
- Location updates
- Ride requests and responses
- Driver status changes

## Monitoring & Documentation

### Health Check
Visit `http://localhost:3001/health` to see:
- Server status
- Number of connected users
- Number of active drivers
- Number of pending rides
- Server timestamp

### API Documentation
Visit `http://localhost:3001/api-docs` for interactive Swagger documentation including:
- REST API endpoints with examples
- Request/response schemas
- WebSocket event documentation
- External services integration guide

### Available Endpoints
- **Health**: `GET /health`
- **API Docs**: `GET /api-docs`
- **Drivers List**: `GET /api/drivers`
- **Driver Connect**: `POST /api/drivers/connect`
- **Driver Info**: `GET /api/drivers/{driverId}`
- **Driver Location**: `PUT /api/drivers/{driverId}/location`
- **Notify Driver**: `POST /api/rides/notify-driver`
- **Main WebSocket**: `ws://localhost:3001/`
- **External Services WebSocket**: `ws://localhost:3001/external`

### Driver API Examples

#### Connect a Driver
```bash
curl -X POST http://localhost:3001/api/drivers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver_123",
    "lat": 51.505,
    "lng": -0.09,
    "status": "online",
    "name": "John Smith",
    "vehicleType": "sedan",
    "licensePlate": "ABC-123"
  }'
```

#### Get Driver Information
```bash
curl http://localhost:3001/api/drivers/driver_123
```

#### Update Driver Location
```bash
curl -X PUT http://localhost:3001/api/drivers/driver_123/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 51.507,
    "lng": -0.08
  }'
```

#### Get All Available Drivers
```bash
curl http://localhost:3001/api/drivers
```
