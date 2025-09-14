# Taxi App

A modern taxi booking application built with React, TypeScript, and Vite. Designed for easy conversion to mobile apps using tools like Capacitor, Cordova, or React Native.

## Features

- **Dual Role Support**: Separate interfaces for drivers and clients
- **Real-time Location Tracking**: GPS-based location sharing for both drivers and clients
- **Ride Booking System**: Clients can request rides with pickup and destination locations
- **Driver Management**: Drivers can go online/offline and accept/reject ride requests
- **Interactive Maps**: Built-in map component using Leaflet for location visualization
- **Real-time Communication**: Socket.io integration for instant updates between drivers and clients
- **Responsive Design**: Material-UI components for a modern, mobile-friendly interface

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router DOM
- **UI Components**: Material-UI (MUI)
- **Maps**: Leaflet + React Leaflet
- **Real-time Communication**: Socket.io Client
- **Styling**: Material-UI Theme System

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd taxi-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and visit `http://localhost:5173`

## Usage

1. **Choose Your Role**: Select whether you want to use the app as a driver or client
2. **Client Flow**:
   - Enter pickup location and destination
   - Request a ride
   - Track ride status in real-time
   - View your location on the map
3. **Driver Flow**:
   - Go online to receive ride requests
   - Accept or reject incoming ride requests
   - Complete rides and go back online for more requests
   - Track your location in real-time

## Backend Setup

The frontend app includes a complete Socket.IO backend server. To enable real-time features:

### Quick Start
1. **Navigate to backend directory:**
   ```bash
   cd ../backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

4. **Verify it's running:**
   Visit `http://localhost:3001/health` in your browser

### Backend Features
- **Real-time Communication**: Socket.IO server for instant updates
- **Location Tracking**: GPS coordinate sharing between users
- **Ride Management**: Complete ride lifecycle handling
- **Driver Matching**: Automatic ride request distribution to available drivers
- **Health Monitoring**: Server status and statistics endpoint

## Mobile Conversion

This app is designed to be easily converted to mobile using various tools:

### Capacitor/Ionic
```bash
npm install @capacitor/core @capacitor/cli
npx cap add ios
npx cap add android
```

### Cordova
```bash
npm install -g cordova
cordova platform add ios
cordova platform add android
```

### React Native
Consider using tools like `react-native-web` compatibility or rewrite specific components for React Native.

## Project Structure

```
src/
├── components/        # Reusable components
│   └── Map.tsx       # Map component using Leaflet
├── contexts/         # React contexts
│   └── AuthContext.tsx # Authentication and user role management
├── pages/           # Main application pages
│   ├── Home.tsx        # Role selection page
│   ├── ClientDashboard.tsx # Client interface
│   └── DriverDashboard.tsx # Driver interface
├── App.tsx          # Main app component with routing
├── main.tsx         # App entry point
└── index.css        # Global styles
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Key Components

- **AuthContext**: Manages user authentication and role state
- **Map Component**: Displays locations using Leaflet maps
- **Client Dashboard**: Handles ride requests and tracking
- **Driver Dashboard**: Manages driver availability and ride acceptance

## Future Enhancements

- User authentication with backend integration
- Payment processing
- Ride history and ratings
- Push notifications
- Route optimization
- Multiple language support
- Dark mode theme
