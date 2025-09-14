import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  TextField,
  Alert,
  Chip,
  Fab,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import { MyLocation, Logout, LocationOn, Flag } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import Map from '../components/Map'
import LocationConfirmationDialog from '../components/LocationConfirmationDialog'
import { io, Socket } from 'socket.io-client'

interface RideRequest {
  id: string
  pickup: string
  destination: string
  status: 'pending' | 'accepted' | 'completed' | 'cancelled'
  driverId?: string
}

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { userId, setUserRole } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [pickupLocation, setPickupLocation] = useState<[number, number] | null>(null)
  const [destination, setDestination] = useState<[number, number] | null>(null)
  const [rideStatus, setRideStatus] = useState<RideRequest | null>(null)
  const [message, setMessage] = useState('')
  const [selectionMode, setSelectionMode] = useState<'pickup' | 'destination' | null>(null)
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)

  useEffect(() => {
    let newSocket: Socket | null = null

    // Connect to socket server (you'll need to set up a backend server)
    try {
      newSocket = io('http://localhost:3001') // Adjust URL as needed
      setSocket(newSocket)
    } catch (error) {
      console.warn('Socket connection failed:', error)
      setMessage('Real-time features unavailable - backend server not running')
      return // Exit early if socket creation failed
    }

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation([latitude, longitude])
          newSocket?.emit('updateLocation', { userId, lat: latitude, lng: longitude, role: 'client' })
        },
        (error) => {
          console.error('Error getting location:', error)
          setMessage('Unable to get your location. Please enable location services.')
        }
      )
    }

    // Listen for ride updates
    newSocket.on('rideAccepted', (data: { rideId: string; driverId: string }) => {
      setRideStatus(prev => prev ? { ...prev, status: 'accepted', driverId: data.driverId } : null)
      setMessage('Your ride has been accepted!')
    })

    newSocket.on('rideCompleted', () => {
      setRideStatus(prev => prev ? { ...prev, status: 'completed' } : null)
      setMessage('Your ride has been completed!')
    })

    return () => {
      newSocket?.disconnect()
    }
  }, [userId])

  const handleRequestRide = () => {
    if (!pickupLocation || !destination) {
      setMessage('Please select both pickup location and destination on the map')
      return
    }

    const rideRequest: RideRequest = {
      id: Date.now().toString(),
      pickup: formatLocationText(pickupLocation),
      destination: formatLocationText(destination),
      status: 'pending'
    }

    setRideStatus(rideRequest)
    if (socket) {
      socket.emit('requestRide', {
        rideId: rideRequest.id,
        userId,
        pickupLocation: pickupLocation,
        destinationLocation: destination,
        location: currentLocation
      })
      setMessage('Ride requested! Waiting for a driver...')
    } else {
      setMessage('Ride requested! (Real-time features unavailable)')
    }
  }

  const handleCancelRide = () => {
    if (rideStatus) {
      if (socket) {
        socket.emit('cancelRide', { rideId: rideStatus.id, userId })
      }
      setRideStatus(null)
      setMessage('Ride cancelled')
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    if (!selectionMode) return

    setTempLocation({ lat, lng })
    setConfirmationOpen(true)
  }

  const handleConfirmLocation = () => {
    if (!tempLocation || !selectionMode) return

    if (selectionMode === 'pickup') {
      setPickupLocation([tempLocation.lat, tempLocation.lng])
    } else if (selectionMode === 'destination') {
      setDestination([tempLocation.lat, tempLocation.lng])
    }

    setTempLocation(null)
    setConfirmationOpen(false)
    setSelectionMode(null)
    setMessage(`${selectionMode === 'pickup' ? 'Pickup' : 'Destination'} location set successfully!`)
  }

  const handleCancelSelection = () => {
    setTempLocation(null)
    setConfirmationOpen(false)
    setSelectionMode(null)
  }

  const formatLocationText = (location: [number, number] | null) => {
    if (!location) return ''
    return `${location[0].toFixed(4)}, ${location[1].toFixed(4)}`
  }

  const handleLogout = () => {
    setUserRole(null)
    navigate('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'accepted': return 'success'
      case 'completed': return 'info'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Client Dashboard
        </Typography>
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

        {rideStatus && (
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ride Status
              </Typography>
              <Chip
                label={rideStatus.status.toUpperCase()}
                color={getStatusColor(rideStatus.status) as any}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2">
                From: {rideStatus.pickup}
              </Typography>
              <Typography variant="body2">
                To: {rideStatus.destination}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {!rideStatus || rideStatus.status === 'completed' ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Request a Ride
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click on the map to select your pickup and destination locations.
            </Typography>

            {/* Location Selection Mode */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Location Type:
              </Typography>
              <ToggleButtonGroup
                value={selectionMode}
                exclusive
                onChange={(_, newMode) => setSelectionMode(newMode)}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="pickup" aria-label="pickup">
                  <LocationOn sx={{ mr: 1 }} />
                  Select Pickup
                </ToggleButton>
                <ToggleButton value="destination" aria-label="destination">
                  <Flag sx={{ mr: 1 }} />
                  Select Destination
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Selected Locations Display */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="success.main">
                  Pickup Location
                </Typography>
                <Typography variant="body2">
                  {pickupLocation ? formatLocationText(pickupLocation) : 'Not selected'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="error.main">
                  Destination
                </Typography>
                <Typography variant="body2">
                  {destination ? formatLocationText(destination) : 'Not selected'}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={handleRequestRide}
              disabled={!pickupLocation || !destination}
              fullWidth
            >
              Request Ride
            </Button>
          </CardContent>
        </Card>
      ) : rideStatus.status === 'pending' ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ride Requested
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Waiting for a driver to accept your ride...
            </Typography>
            <Button variant="outlined" color="error" onClick={handleCancelRide}>
              Cancel Ride
            </Button>
          </CardContent>
        </Card>
      ) : rideStatus.status === 'accepted' ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ride Accepted!
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Your driver is on the way. Track your ride in real-time.
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Map {selectionMode && ` - Selecting ${selectionMode === 'pickup' ? 'Pickup Location' : 'Destination'}`}
          </Typography>
          {selectionMode && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Click on the map to select your {selectionMode === 'pickup' ? 'pickup' : 'destination'} location.
            </Alert>
          )}
          <Map
            center={currentLocation || [51.505, -0.09]}
            markers={[
              ...(currentLocation ? [{ lat: currentLocation[0], lng: currentLocation[1], label: 'Your Current Location', type: 'current' as const }] : []),
              ...(pickupLocation ? [{ lat: pickupLocation[0], lng: pickupLocation[1], label: 'Pickup Location', type: 'pickup' as const }] : []),
              ...(destination ? [{ lat: destination[0], lng: destination[1], label: 'Destination', type: 'destination' as const }] : [])
            ]}
            height="500px"
            selectable={!!selectionMode}
            onLocationSelect={handleMapClick}
          />
        </CardContent>
      </Card>

      {/* Location Confirmation Dialog */}
      <LocationConfirmationDialog
        open={confirmationOpen}
        onClose={handleCancelSelection}
        onConfirm={handleConfirmLocation}
        location={tempLocation}
        type={selectionMode || 'pickup'}
      />
    </Container>
  )
}

export default ClientDashboard
