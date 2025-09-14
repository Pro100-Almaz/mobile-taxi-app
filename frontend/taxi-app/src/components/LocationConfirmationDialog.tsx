import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material'

interface LocationConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  location: { lat: number; lng: number } | null
  type: 'pickup' | 'destination'
}

const LocationConfirmationDialog: React.FC<LocationConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  location,
  type
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Confirm {type === 'pickup' ? 'Pickup' : 'Destination'} Location
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You selected this location as your {type} point:
        </Typography>
        {location && (
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Latitude:</strong> {location.lat.toFixed(6)}
            </Typography>
            <Typography variant="body2">
              <strong>Longitude:</strong> {location.lng.toFixed(6)}
            </Typography>
          </Box>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {type === 'pickup'
            ? 'This is where your driver will pick you up.'
            : 'This is where you want to go.'
          }
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Confirm {type === 'pickup' ? 'Pickup' : 'Destination'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LocationConfirmationDialog
