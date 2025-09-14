# 🚗 Taxi App - Full Stack

A complete taxi booking application with real-time GPS tracking, built for easy mobile conversion.

## 🏗️ **Project Structure**

```
hack/
├── front/                 # React Frontend (Mobile-Ready)
│   └── taxi-app/         # Main React Application
│       ├── src/
│       │   ├── components/    # Reusable Components
│       │   │   ├── Map.tsx                    # Interactive Leaflet Map
│       │   │   └── LocationConfirmationDialog.tsx
│       │   ├── contexts/      # React Context
│       │   │   └── AuthContext.tsx           # User Authentication
│       │   ├── pages/         # Main Pages
│       │   │   ├── Home.tsx                   # Role Selection
│       │   │   ├── ClientDashboard.tsx        # Client Interface
│       │   │   └── DriverDashboard.tsx        # Driver Interface
│       │   └── App.tsx        # Main App Component
│       └── package.json
└── backend/               # Node.js Backend
    ├── server.js          # Socket.IO Server
    ├── package.json
    └── README.md
```

## 🚀 **Quick Start**

### 1. **Start Backend Server**
```bash
cd backend
npm install
npm start
```

**Verify Backend:** Visit `http://localhost:3001/health`

### 2. **Start Frontend App**
```bash
cd front/taxi-app
npm install
npm run dev
```

**Access App:** Visit `http://localhost:5173`

## 🎯 **Features**

### ✅ **Frontend (React + TypeScript)**
- **Dual Role Support**: Separate interfaces for drivers and clients
- **Interactive Map**: Click-to-select pickup/destination locations
- **Real-time GPS**: Live location tracking with confirmation dialogs
- **Material-UI**: Modern, responsive design
- **Socket.IO Client**: Real-time communication with backend
- **Mobile-Ready**: Optimized for Capacitor/Cordova/React Native conversion

### ✅ **Backend (Node.js + Socket.IO)**
- **Real-time Communication**: Instant updates between users
- **Location Broadcasting**: Share GPS coordinates in real-time
- **Ride Management**: Complete lifecycle from request to completion
- **Driver Matching**: Automatic ride distribution to available drivers
- **Health Monitoring**: Server status and statistics
- **CORS Enabled**: Cross-origin support for frontend

## 🎮 **How to Use**

### **For Clients:**
1. **Select "Client"** on the home page
2. **Click map buttons** to choose pickup/destination
3. **Click on map** to select exact locations
4. **Confirm locations** in the dialog
5. **Request ride** - it will be sent to all available drivers
6. **Track status** in real-time

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

### **Backend:**
- **Node.js** + **Express**
- **Socket.IO** for real-time communication
- **CORS** for cross-origin requests

## 📱 **Mobile Conversion**

### **Capacitor (Recommended)**
```bash
cd front/taxi-app
npm install @capacitor/core @capacitor/cli
npx cap add ios
npx cap add android
npx cap sync
```

### **Cordova**
```bash
cd front/taxi-app
npm install -g cordova
cordova platform add ios
cordova platform add android
```

### **React Native**
The React components are mobile-compatible and can be adapted for React Native.

## 🔌 **API Documentation**

### **Socket Events**

#### **Client → Server**
- `updateLocation` - Send GPS coordinates
- `requestRide` - Request a new ride
- `cancelRide` - Cancel pending ride

#### **Driver → Server**
- `driverOnline` - Mark driver as available
- `driverOffline` - Mark driver as unavailable
- `acceptRide` - Accept ride request
- `rejectRide` - Reject ride request
- `completeRide` - Mark ride as completed

#### **Server → Client**
- `rideAccepted` - Ride accepted by driver
- `rideCompleted` - Ride finished
- `rideRequest` - New ride request (to drivers)

## 🚀 **Development**

### **Frontend Development**
```bash
cd front/taxi-app
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### **Backend Development**
```bash
cd backend
npm run dev          # Start with nodemon (auto-restart)
npm start            # Start production server
```

## 📊 **Health Checks**

- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:3001/health`

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
