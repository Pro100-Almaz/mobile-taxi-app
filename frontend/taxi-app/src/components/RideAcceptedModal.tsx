import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Avatar
} from '@mui/material'
import { DirectionsCar, Person, AccessTime, LocationOn, Flag } from '@mui/icons-material'

interface RideAcceptedData {
  rideId: string
  driverId: string
  driverName: string
  driverLocation?: [number, number]
  vehicleType?: string
  licensePlate?: string
  pickupLocation: [number, number]
  destinationLocation: [number, number]
  acceptedAt: string
  estimatedArrivalTime?: {
    distance: number
    estimatedMinutes: number
    estimatedArrival: string
  }
}

interface RideAcceptedModalProps {
  open: boolean
  onClose: () => void
  rideData: RideAcceptedData | null
}

const RideAcceptedModal: React.FC<RideAcceptedModalProps> = ({
  open,
  onClose,
  rideData
}) => {
  if (!rideData) return null

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatLocation = (location: [number, number]) => {
    return `${location[0].toFixed(4)}, ${location[1].toFixed(4)}`
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }
      }}
    >
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
        color: 'white',
        textAlign: 'center',
        py: 3,
        position: 'relative'
      }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <DirectionsCar sx={{ fontSize: 40, color: 'white' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          🎉 Ride Accepted!
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Your driver is on the way
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Driver Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" />
            Driver Details
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <Person sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {rideData.driverName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Driver ID: {rideData.driverId}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <DirectionsCar color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Vehicle
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {rideData.vehicleType || 'Standard'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Plate
              </Typography>
              <Chip
                label={rideData.licensePlate || 'N/A'}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Ride Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn color="primary" />
            Ride Details
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOn color="success" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                From
              </Typography>
              <Typography variant="body1">
                {formatLocation(rideData.pickupLocation)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Flag color="error" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                To
              </Typography>
              <Typography variant="body1">
                {formatLocation(rideData.destinationLocation)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ETA Information */}
        {rideData.estimatedArrivalTime && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime color="primary" />
              Estimated Arrival
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`${rideData.estimatedArrivalTime.estimatedMinutes} min`}
                color="primary"
                size="medium"
                sx={{ fontSize: '1.1rem', fontWeight: 'bold', height: '40px' }}
              />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Distance: {rideData.estimatedArrivalTime.distance.toFixed(1)} km
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Arrival: {formatTime(rideData.estimatedArrivalTime.estimatedArrival)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Ride ID and Accepted Time */}
        <Box sx={{
          backgroundColor: 'grey.50',
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Ride ID: <strong>{rideData.rideId}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accepted at: {formatTime(rideData.acceptedAt)}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          size="large"
          sx={{
            borderRadius: 2,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          Got it! Track my ride
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RideAcceptedModal
