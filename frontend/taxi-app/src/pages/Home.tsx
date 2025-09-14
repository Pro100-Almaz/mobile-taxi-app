import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Typography, Button, Box, Card, CardContent } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { setUserRole, isAuthenticated, userRole, displayName, logout } = useAuth()

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && userRole) {
      navigate(`/${userRole}`)
    }
  }, [isAuthenticated, userRole, navigate])

  const handleRoleSelect = (role: 'driver' | 'client') => {
    // User ID is automatically generated when setting role
    setUserRole(role)
    navigate(`/${role}`)
  }

  const handleContinueAsCurrentUser = () => {
    if (userRole) {
      navigate(`/${userRole}`)
    }
  }

  // Show different UI based on authentication status
  if (isAuthenticated && userRole) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Typography variant="h2" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Welcome Back!
        </Typography>

        <Typography variant="h5" align="center" color="text.secondary" sx={{ mb: 3 }}>
          You are signed in as <strong>{displayName}</strong>
        </Typography>

        <Card sx={{ width: '100%', maxWidth: 400, mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {userRole === 'driver' ? '🚗 Driver Account' : '👤 Client Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {userRole === 'driver'
                ? 'Ready to accept rides and earn money'
                : 'Ready to book rides and get picked up'
              }
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={handleContinueAsCurrentUser}
              sx={{ mb: 2 }}
            >
              Continue as {displayName}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={logout}
              color="error"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </Container>
    )
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
