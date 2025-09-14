import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material'
import { Logout, Check, Close } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import Map from '../components/Map'
import { io, Socket } from 'socket.io-client'

interface RideRequest {
  id: string
  userId: string
  pickup: string
  destination: string
  location?: [number, number]
  status: 'pending' | 'accepted' | 'completed' | 'cancelled'
}

interface DriverStatus {
  isOnline: boolean
  currentRide: RideRequest | null
}

const DriverDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { userId, logout, displayName } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [driverStatus, setDriverStatus] = useState<DriverStatus>({ isOnline: false, currentRide: null })
  const [availableRides, setAvailableRides] = useState<RideRequest[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Connect to socket server (FastAPI backend)
    const newSocket = io('http://localhost:8000') // FastAPI backend
    setSocket(newSocket)

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation([latitude, longitude])
          newSocket.emit('updateLocation', { userId, lat: latitude, lng: longitude, role: 'driver' })
        },
        (error) => {
          console.error('Error getting location:', error)
          setMessage('Unable to get your location. Please enable location services.')
        }
      )

      // Watch position for real-time updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation([latitude, longitude])
          if (driverStatus.isOnline) {
            newSocket.emit('updateLocation', { userId, lat: latitude, lng: longitude, role: 'driver' })
          }
        },
        (error) => console.error('Error watching position:', error),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }

    // Listen for ride requests
    newSocket.on('rideRequest', (rideData: RideRequest) => {
      if (driverStatus.isOnline && !driverStatus.currentRide) {
        setAvailableRides(prev => [...prev, rideData])
        setMessage('New ride request available!')
      }
    })

    newSocket.on('rideCancelled', (data: { rideId: string }) => {
      setAvailableRides(prev => prev.filter(ride => ride.id !== data.rideId))
      if (driverStatus.currentRide?.id === data.rideId) {
        setDriverStatus(prev => ({ ...prev, currentRide: null }))
        setMessage('Ride was cancelled by the client')
      }
    })

    return () => {
      newSocket.disconnect()
    }
  }, [userId, driverStatus.isOnline, driverStatus.currentRide])

  const toggleOnlineStatus = () => {
    const newStatus = !driverStatus.isOnline
    setDriverStatus(prev => ({ ...prev, isOnline: newStatus }))

    if (newStatus) {
      socket?.emit('driverOnline', { userId })
      setMessage('You are now online and available for rides')
    } else {
      socket?.emit('driverOffline', { userId })
      setAvailableRides([])
      setMessage('You are now offline')
    }
  }

  const handleAcceptRide = (ride: RideRequest) => {
    setDriverStatus(prev => ({ ...prev, currentRide: { ...ride, status: 'accepted' } }))
    setAvailableRides(prev => prev.filter(r => r.id !== ride.id))
    socket?.emit('acceptRide', { rideId: ride.id, driverId: userId, clientId: ride.userId })
    setMessage(`Ride accepted! Head to ${ride.pickup}`)
  }

  const handleRejectRide = (ride: RideRequest) => {
    setAvailableRides(prev => prev.filter(r => r.id !== ride.id))
    socket?.emit('rejectRide', { rideId: ride.id, driverId: userId })
  }

  const handleCompleteRide = () => {
    if (driverStatus.currentRide) {
      socket?.emit('completeRide', {
        rideId: driverStatus.currentRide.id,
        driverId: userId,
        clientId: driverStatus.currentRide.userId
      })
      setDriverStatus(prev => ({ ...prev, currentRide: null }))
      setMessage('Ride completed successfully!')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Driver Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {displayName}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Logout />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {message && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Driver Status
            </Typography>
            <Chip
              label={driverStatus.isOnline ? 'ONLINE' : 'OFFLINE'}
              color={driverStatus.isOnline ? 'success' : 'error'}
              sx={{ mb: 2 }}
            />
            <Button
              variant={driverStatus.isOnline ? 'outlined' : 'contained'}
              color={driverStatus.isOnline ? 'error' : 'success'}
              onClick={toggleOnlineStatus}
              fullWidth
            >
              {driverStatus.isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Location
            </Typography>
            {currentLocation ? (
              <Typography variant="body2" color="text.secondary">
                Lat: {currentLocation[0].toFixed(4)}, Lng: {currentLocation[1].toFixed(4)}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Getting location...
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {driverStatus.currentRide && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Ride
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              From: {driverStatus.currentRide.pickup}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              To: {driverStatus.currentRide.destination}
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={handleCompleteRide}
            >
              Complete Ride
            </Button>
          </CardContent>
        </Card>
      )}

      {availableRides.length > 0 && !driverStatus.currentRide && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Available Rides
            </Typography>
            <List>
              {availableRides.map((ride) => (
                <ListItem key={ride.id} divider>
                  <ListItemText
                    primary={`${ride.pickup} → ${ride.destination}`}
                    secondary={`Client ID: ${ride.userId}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      color="success"
                      onClick={() => handleAcceptRide(ride)}
                      sx={{ mr: 1 }}
                    >
                      <Check />
                    </IconButton>
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleRejectRide(ride)}
                    >
                      <Close />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Map
          </Typography>
          <Map
            center={currentLocation || [51.505, -0.09]}
            markers={currentLocation ? [{ lat: currentLocation[0], lng: currentLocation[1], label: 'Your Location' }] : []}
            height="500px"
          />
        </CardContent>
      </Card>
    </Container>
  )
}

export default DriverDashboard
