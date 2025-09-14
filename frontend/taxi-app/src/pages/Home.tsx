import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Typography, Button, Box, Card, CardContent } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { setUserRole, setUserId } = useAuth()

  const handleRoleSelect = (role: 'driver' | 'client') => {
    setUserRole(role)
    // Generate a simple user ID for demo purposes
    const userId = `${role}_${Date.now()}`
    setUserId(userId)
    navigate(`/${role}`)
  }

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Typography variant="h2" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Taxi App
      </Typography>

      <Typography variant="h5" align="center" color="text.secondary" sx={{ mb: 6 }}>
        Choose your role to get started
      </Typography>

      <Box sx={{ display: 'flex', gap: 4, width: '100%', maxWidth: 500 }}>
        <Card sx={{ flex: 1, cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🚗 Driver
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Accept rides and earn money
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleRoleSelect('driver')}
              sx={{ mt: 2 }}
            >
              Continue as Driver
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" gutterBottom>
              👤 Client
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Book rides and get <br/> picked up
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleRoleSelect('client')}
              sx={{ mt: 2 }}
            >
              Continue as Client
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default Home
