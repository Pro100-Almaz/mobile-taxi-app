# 🚗 Taxi App - FastAPI Backend with React Frontend

A complete taxi booking application with real-time GPS tracking, built with FastAPI backend and React frontend, optimized for easy mobile conversion.

## 🏗️ **Project Structure**

```
hack/
├── backend/                          # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py                   # FastAPI Application Entry Point
│   │   ├── core/
│   │   │   ├── config.py             # Application Configuration
│   │   │   └── websocket.py          # WebSocket Manager
│   │   ├── services/
│   │   │   └── driver_generator.py   # Driver Generation Service
│   │   └── api/
│   │       ├── websocket.py          # WebSocket API Routes
│   │       ├── drivers.py            # Driver Management API
│   │       ├── clients.py            # Client Management API
│   │       └── rides.py              # Ride Management API
│   ├── requirements.txt              # Python Dependencies
│   ├── Dockerfile                    # Main Service Dockerfile
│   ├── Dockerfile.generator          # Driver Generator Dockerfile
│   └── geo_locations_astana_hackathon  # Location Data (ignored)
├── frontend/                         # React Frontend
│   └── taxi-app/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Map.tsx           # Interactive Leaflet Map
│       │   │   ├── LocationConfirmationDialog.tsx
│       │   │   └── RideAcceptedModal.tsx  # 🎉 Client Notification Modal
│       │   ├── contexts/
│       │   │   └── AuthContext.tsx   # User Authentication & Session
│       │   ├── pages/
│       │   │   ├── Home.tsx          # Role Selection Landing Page
│       │   │   ├── ClientDashboard.tsx  # Client Interface
│       │   │   └── DriverDashboard.tsx  # Driver Interface
│       │   └── utils/
│       │       └── userIdGenerator.ts   # User ID Generation
│       ├── package.json
│       ├── Dockerfile
│       └── nginx.conf
├── docker-compose.yml                # Multi-service Docker Setup
├── .gitignore                       # Git Ignore (includes geo_* files)
└── README.md                        # This file
```

## 🚀 **Quick Start**

### **Option 1: Docker Compose (Recommended)**

```bash
# Clone and navigate to project
cd hack

# Start all services
docker-compose up --build

# Access points:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### **Option 2: Manual Setup**

#### **1. Start Backend Services**
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start main WebSocket service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# In another terminal, start driver generator
python -c "
import asyncio
from app.services.driver_generator import DriverGeneratorService

async def main():
    service = DriverGeneratorService()
    await service.initialize_drivers()
    print('Driver service running...')

asyncio.run(main())
"
```

**Verify Backend:** Visit `http://localhost:8000/health`

#### **2. Start Frontend App**
```bash
cd frontend/taxi-app

# Install dependencies
npm install

# Start development server
npm run dev
```

**Access App:** Visit `http://localhost:5173`

## 🎯 **Features**

### ✅ **Frontend (React + TypeScript)**
- **Dual Role Support**: Separate interfaces for drivers and clients
- **Interactive Map**: Click-to-select pickup/destination locations
- **Real-time GPS**: Live location tracking with confirmation dialogs
- **Ride Acceptance Modal**: 🎉 Beautiful notification when driver accepts ride
- **Material-UI**: Modern, responsive design
- **Socket.IO Client**: Real-time communication with backend
- **Mobile-Ready**: Optimized for Capacitor/Cordova/React Native conversion

### ✅ **Backend Services (FastAPI + Python)**

#### **🚗 WebSocket Service** (`taxi-websocket-service`)
- **Real-time Communication**: WebSocket endpoints for instant updates
- **Ride Management**: Complete lifecycle from request to acceptance
- **Connection Management**: Handle multiple concurrent users
- **Location Broadcasting**: Share GPS coordinates in real-time
- **Health Monitoring**: Server status and statistics endpoints

#### **🎯 Driver Generator Service** (`driver-generator-service`)
- **Random Driver Generation**: Creates 10 drivers using real location data
- **Location Data Integration**: Uses CSV location data from Astana hackathon
- **Real-time Updates**: Periodic driver location simulation
- **Caching**: Optimized data loading and storage
- **Statistics**: Driver generation and status tracking

#### **🔧 Additional Features**
- **Redis Integration**: Optional caching for production
- **Docker Support**: Complete containerization setup
- **API Documentation**: Auto-generated Swagger docs
- **Health Checks**: Service monitoring and status

## 🔌 **Socket.IO Integration**

### **Frontend Connection**
```typescript
// ClientDashboard.tsx - Lines 62-73
const newSocket = io('http://localhost:3001') // Change to your backend URL
setSocket(newSocket)

// Listen for ride acceptance
socket.on('rideAccepted', (data: RideAcceptedData) => {
  // 🎉 This triggers the notification modal!
  setAcceptedRideData(data)
  setModalOpen(true)
  playNotificationSound()
  showBrowserNotification(data)
})
```

### **Backend WebSocket Events**

#### **Client → Server**
- `updateLocation` - Send GPS coordinates
- `requestRide` - Request a new ride
- `cancelRide` - Cancel pending ride

#### **Driver → Server**
- `updateLocation` - Send driver GPS coordinates
- `acceptRide` - Accept ride request
- `rejectRide` - Reject ride request

#### **Server → Client**
- `rideAccepted` - 🎉 **Ride accepted notification** (triggers modal!)
- `rideCompleted` - Ride finished
- `rideRequest` - New ride request (to drivers)

#### **Server → Driver**
- `rideRequest` - New ride available
- `rideCancelled` - Ride cancelled by client
- `rideAssigned` - Ride successfully assigned

## 🎮 **How to Use**

### **For Clients:**
1. **Select "Client"** on the home page
2. **Click map buttons** to choose pickup/destination
3. **Click on map** to select exact locations
4. **Confirm locations** in the dialog
5. **Request ride** - it will be sent to all available drivers
6. **Wait for driver acceptance** - 🎉 **Modal will appear automatically!**
7. **Track status** in real-time

### **For Drivers:**
1. **Select "Driver"** on the home page
2. **Go Online** to start receiving ride requests
3. **Accept/Reject** incoming ride requests
4. **Complete rides** when finished
5. **Go back online** for more rides

## 🔧 **Tech Stack**

### **Frontend:**
- **React 19** + **TypeScript** + **Vite**
- **React Router** for navigation
- **Material-UI** for components
- **Leaflet** + **React Leaflet** for maps
- **Socket.IO Client** for real-time comms

### **Backend Services:**
- **FastAPI** + **Python 3.11** for WebSocket service
- **Pandas** for location data processing
- **Redis** for optional caching
- **Docker** for containerization

### **Infrastructure:**
- **Docker Compose** for multi-service orchestration
- **Nginx** for frontend serving
- **Health checks** and monitoring

## 🚀 **Development & Deployment**

### **Local Development**
```bash
# Backend development
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend development
cd frontend/taxi-app
npm install
npm run dev
```

### **Docker Deployment**
```bash
# Build and run all services
docker-compose up --build

# Or run specific services
docker-compose up taxi-websocket-service
docker-compose up driver-generator-service
docker-compose up frontend
```

### **Production Deployment**
```bash
# Scale services as needed
docker-compose up -d --scale taxi-websocket-service=3

# View logs
docker-compose logs -f taxi-websocket-service

# Update services
docker-compose pull && docker-compose up -d
```

## 📱 **Mobile Conversion**

### **Capacitor (Recommended)**
```bash
cd frontend/taxi-app
npm install @capacitor/core @capacitor/cli
npx cap add ios
npx cap add android
npx cap sync
```

### **Cordova**
```bash
cd frontend/taxi-app
npm install -g cordova
cordova platform add ios
cordova platform add android
```

### **React Native**
The React components are mobile-compatible and can be adapted for React Native.

## 🔌 **API Documentation**

### **WebSocket Events**

#### **Client → Server**
- `updateLocation` - Send GPS coordinates with user info
- `requestRide` - Request a new ride with pickup/destination
- `cancelRide` - Cancel pending ride

#### **Driver → Server**
- `updateLocation` - Send driver GPS coordinates
- `acceptRide` - Accept ride request with IDs
- `rejectRide` - Reject ride request
- `completeRide` - Mark ride as completed

#### **Server → Client**
- `rideAccepted` - 🎉 **Ride accepted** (triggers notification modal!)
- `rideCompleted` - Ride finished
- `rideCancelled` - Ride cancelled

#### **Server → Driver**
- `rideRequest` - New ride available for acceptance
- `rideAssigned` - Ride successfully assigned
- `rideCancelled` - Ride cancelled by client

### **REST API Endpoints**

#### **Drivers**
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/{id}` - Get driver by ID
- `GET /api/drivers/online` - Get online drivers
- `POST /api/drivers/generate` - Generate new driver
- `GET /api/drivers/stats` - Driver statistics

#### **Clients**
- `POST /api/clients/connect` - Register client
- `GET /api/clients` - Get all clients
- `GET /api/clients/{id}` - Get client by ID

#### **Rides**
- `POST /api/rides/notify-driver` - Send ride to drivers
- `GET /api/rides` - Get rides with status filter
- `GET /api/rides/{id}` - Get specific ride
- `GET /api/rides/stats` - Ride statistics

## 🚀 **Development & Testing**

### **Frontend Development**
```bash
cd frontend/taxi-app
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### **Backend Development**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload  # FastAPI with auto-reload
```

### **Testing Ride Acceptance**
```bash
# Use the test HTML file
open test-driver-acceptance.html

# Or test manually with curl
curl -X POST http://localhost:8000/api/rides/notify-driver \
  -H "Content-Type: application/json" \
  -d '{"rideId":"test123","clientId":"client123","pickupLocation":[51.505,-0.09]}'
```

## 📊 **Health Checks & Monitoring**

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000/health`
- **API Documentation:** `http://localhost:8000/docs`
- **WebSocket Stats:** `http://localhost:8000/ws/stats`

## 🐛 **Troubleshooting**

### **Gray Screen Issues**
- Check browser console for JavaScript errors
- Ensure backend server is running on port 3001
- Verify all dependencies are installed

### **Socket Connection Errors**
- Backend server must be running
- Check firewall settings
- Verify port 3001 is not blocked

### **Map Not Loading**
- Check internet connection for tile loading
- Verify location permissions in browser
- Check browser console for Leaflet errors

## 📈 **Next Steps**

- **User Authentication** - Add login/signup
- **Payment Integration** - Stripe/PayPal integration
- **Ride History** - Past rides and ratings
- **Push Notifications** - Mobile push notifications
- **Route Optimization** - GPS routing and ETAs
- **Multi-language Support** - i18n implementation

---

**Built with ❤️ for modern taxi booking experiences**
