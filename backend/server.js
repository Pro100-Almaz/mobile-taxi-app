const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const app = express()
const server = http.createServer(app)

// Enable CORS for all routes
app.use(cors({
  origin: "http://localhost:5173", // Allow requests from Vite dev server
  methods: ["GET", "POST"],
  credentials: true
}))

// Enable JSON parsing
app.use(express.json())

// Serve static files from public directory
app.use(express.static('public'))

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Taxi App Backend API',
      version: '1.0.0',
      description: 'API documentation for Taxi App Backend with Socket.IO real-time communication',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
  },
  apis: [__filename], // Path to the API docs
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
})

// Store connected users and their locations
const connectedUsers = new Map()
const activeDrivers = new Set()
const pendingRides = new Map() // rideId -> ride data

console.log('🚗 Taxi App Backend Server Starting...')

// External services namespace for monitoring
const externalIo = io.of('/external')

externalIo.on('connection', (socket) => {
  console.log(`🔗 External service connected: ${socket.id}`)

  // Send initial data to external service
  socket.emit('initialData', {
    drivers: Array.from(activeDrivers).map(driverId => {
      const driverData = connectedUsers.get(driverId)
      return driverData ? {
        driverId,
        location: driverData.location,
        lastUpdate: new Date(driverData.lastUpdate).toISOString()
      } : null
    }).filter(Boolean),
    pendingRides: Array.from(pendingRides.values()).map(ride => ({
      rideId: ride.rideId,
      clientId: ride.clientId,
      pickupLocation: ride.pickupLocation,
      destinationLocation: ride.destinationLocation,
      status: ride.status,
      requestedAt: new Date(ride.requestedAt).toISOString()
    }))
  })

  // Handle external service requests for specific driver locations
  socket.on('requestDriverLocation', (data) => {
    const { driverId } = data
    const driverData = connectedUsers.get(driverId)

    if (driverData) {
      socket.emit('driverLocation', {
        driverId,
        location: driverData.location,
        lastUpdate: new Date(driverData.lastUpdate).toISOString()
      })
    } else {
      socket.emit('driverNotFound', { driverId })
    }
  })

  socket.on('disconnect', () => {
    console.log(`🔌 External service disconnected: ${socket.id}`)
  })
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`)

  // Handle user location updates
  socket.on('updateLocation', (data) => {
    const { userId, lat, lng, role } = data
    console.log(`📍 Location update from ${role} ${userId}: ${lat}, ${lng}`)

    // Store user location
    connectedUsers.set(userId, {
      socketId: socket.id,
      location: { lat, lng },
      role,
      lastUpdate: Date.now()
    })

    // If it's a driver, add to active drivers
    if (role === 'driver') {
      activeDrivers.add(userId)
    }

    // Broadcast location to other users (for real-time tracking)
    socket.broadcast.emit('userLocationUpdate', {
      userId,
      location: { lat, lng },
      role
    })

    // Notify external services about driver location updates
    if (role === 'driver') {
      externalIo.emit('driverLocationUpdate', {
        driverId: userId,
        location: { lat, lng },
        lastUpdate: new Date().toISOString()
      })
    }
  })

  // Handle driver going online/offline
  socket.on('driverOnline', (data) => {
    const { userId } = data
    activeDrivers.add(userId)
    console.log(`🚕 Driver ${userId} is now online`)

    // Notify all clients about available drivers
    io.emit('driversAvailable', Array.from(activeDrivers))

    // Notify external services
    externalIo.emit('driverStatusChange', {
      driverId: userId,
      status: 'online',
      timestamp: new Date().toISOString()
    })
  })

  socket.on('driverOffline', (data) => {
    const { userId } = data
    activeDrivers.delete(userId)
    console.log(`😴 Driver ${userId} is now offline`)

    // Notify all clients about available drivers
    io.emit('driversAvailable', Array.from(activeDrivers))

    // Notify external services
    externalIo.emit('driverStatusChange', {
      driverId: userId,
      status: 'offline',
      timestamp: new Date().toISOString()
    })
  })

  // Handle ride requests from clients
  socket.on('requestRide', (data) => {
    const { rideId, userId, pickupLocation, destinationLocation, location } = data
    console.log(`🚖 New ride request from ${userId}:`, data)

    // Store the ride request
    pendingRides.set(rideId, {
      rideId,
      clientId: userId,
      pickupLocation,
      destinationLocation,
      clientLocation: location,
      status: 'pending',
      requestedAt: Date.now()
    })

    // Notify all online drivers about the new ride request
    const rideData = {
      id: rideId,
      userId,
      pickup: `${pickupLocation[0].toFixed(4)}, ${pickupLocation[1].toFixed(4)}`,
      destination: `${destinationLocation[0].toFixed(4)}, ${destinationLocation[1].toFixed(4)}`,
      location: pickupLocation
    }

    // Send to all connected drivers
    activeDrivers.forEach(driverId => {
      const driverData = connectedUsers.get(driverId)
      if (driverData && driverData.socketId) {
        io.to(driverData.socketId).emit('rideRequest', rideData)
      }
    })

    // Notify external services about new ride request
    externalIo.emit('rideCreated', {
      rideId,
      clientId: userId,
      pickupLocation,
      destinationLocation,
      clientLocation: location,
      status: 'pending',
      requestedAt: new Date().toISOString()
    })

    console.log(`📤 Sent ride request to ${activeDrivers.size} drivers`)
  })

  // Handle ride acceptance by driver
  socket.on('acceptRide', (data) => {
    const { rideId, driverId, clientId } = data
    console.log(`✅ Ride ${rideId} accepted by driver ${driverId}`)

    const ride = pendingRides.get(rideId)
    if (ride) {
      ride.status = 'accepted'
      ride.driverId = driverId
      ride.acceptedAt = Date.now()

      // Notify the client
      const clientData = connectedUsers.get(clientId)
      if (clientData && clientData.socketId) {
        io.to(clientData.socketId).emit('rideAccepted', {
          rideId,
          driverId
        })
      }

      // Notify external services
      externalIo.emit('rideAccepted', {
        rideId,
        driverId,
        clientId,
        pickupLocation: ride.pickupLocation,
        destinationLocation: ride.destinationLocation,
        acceptedAt: new Date(ride.acceptedAt).toISOString()
      })

      // Remove from pending rides
      pendingRides.delete(rideId)
    }
  })

  // Handle ride rejection by driver
  socket.on('rejectRide', (data) => {
    const { rideId, driverId } = data
    console.log(`❌ Ride ${rideId} rejected by driver ${driverId}`)

    // The ride remains in pending state for other drivers
    // You could implement a timeout mechanism here
  })

  // Handle ride cancellation by client
  socket.on('cancelRide', (data) => {
    const { rideId, userId } = data
    console.log(`🚫 Ride ${rideId} cancelled by client ${userId}`)

    // Remove from pending rides
    pendingRides.delete(rideId)

    // Notify all drivers that the ride is no longer available
    activeDrivers.forEach(driverId => {
      const driverData = connectedUsers.get(driverId)
      if (driverData && driverData.socketId) {
        io.to(driverData.socketId).emit('rideCancelled', { rideId })
      }
    })
  })

  // Handle ride completion
  socket.on('completeRide', (data) => {
    const { rideId, driverId, clientId } = data
    console.log(`🏁 Ride ${rideId} completed by driver ${driverId}`)

    // Notify the client
    const clientData = connectedUsers.get(clientId)
    if (clientData && clientData.socketId) {
      io.to(clientData.socketId).emit('rideCompleted')
    }

    // Notify external services
    externalIo.emit('rideCompleted', {
      rideId,
      driverId,
      clientId,
      completedAt: new Date().toISOString()
    })

    // Driver becomes available again
    activeDrivers.add(driverId)
    io.emit('driversAvailable', Array.from(activeDrivers))

    // Notify external services about driver status change
    externalIo.emit('driverStatusChange', {
      driverId,
      status: 'online',
      timestamp: new Date().toISOString()
    })
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`)

    // Find and remove the disconnected user
    for (const [userId, userData] of connectedUsers.entries()) {
      if (userData.socketId === socket.id) {
        connectedUsers.delete(userId)
        if (userData.role === 'driver') {
          activeDrivers.delete(userId)
          io.emit('driversAvailable', Array.from(activeDrivers))
        }
        console.log(`👋 ${userData.role} ${userId} disconnected`)
        break
      }
    }
  })
})

/**
 * @swagger
 * /api/drivers:
 *   get:
 *     summary: Get all available drivers with their locations
 *     description: Returns a list of all currently online drivers with their location data for external services to calculate distances
 *     tags: [Drivers]
 *     responses:
 *       200:
 *         description: List of available drivers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 drivers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       driverId:
 *                         type: string
 *                         description: Unique driver identifier
 *                       location:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             description: Latitude coordinate
 *                           lng:
 *                             type: number
 *                             description: Longitude coordinate
 *                       lastUpdate:
 *                         type: string
 *                         format: date-time
 *                         description: Last location update timestamp
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of available drivers
 *       500:
 *         description: Server error
 */
app.get('/api/drivers', (req, res) => {
  try {
    const drivers = []

    activeDrivers.forEach(driverId => {
      const driverData = connectedUsers.get(driverId)
      if (driverData) {
        drivers.push({
          driverId,
          location: driverData.location,
          lastUpdate: new Date(driverData.lastUpdate).toISOString()
        })
      }
    })

    res.json({
      drivers,
      totalCount: drivers.length
    })
  } catch (error) {
    console.error('Error fetching drivers:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Monitoring dashboard route
app.get('/monitoring', (req, res) => {
  res.sendFile(__dirname + '/public/monitoring.html');
});

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all connected clients with their locations
 *     description: Returns a list of all currently connected clients with their location data
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: List of connected clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       clientId:
 *                         type: string
 *                         description: Unique client identifier
 *                       location:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             description: Latitude coordinate
 *                           lng:
 *                             type: number
 *                             description: Longitude coordinate
 *                       lastUpdate:
 *                         type: string
 *                         format: date-time
 *                         description: Last location update timestamp
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of connected clients
 *       500:
 *         description: Server error
 */
app.get('/api/clients', (req, res) => {
  try {
    const clients = []

    connectedUsers.forEach((userData, userId) => {
      if (userData.role === 'client') {
        clients.push({
          clientId: userId,
          location: userData.location,
          lastUpdate: new Date(userData.lastUpdate).toISOString(),
          connectedAt: userData.connectedAt ? new Date(userData.connectedAt).toISOString() : null
        })
      }
    })

    res.json({
      clients,
      totalCount: clients.length
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get comprehensive dashboard statistics
 *     description: Returns detailed statistics for the monitoring dashboard including drivers, clients, rides, and system info
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 server:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       description: Server uptime in seconds
 *                     memory:
 *                       type: object
 *                       description: Memory usage statistics
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 drivers:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     online:
 *                       type: integer
 *                     locations:
 *                       type: array
 *                 clients:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     locations:
 *                       type: array
 *                 rides:
 *                   type: object
 *                   properties:
 *                     pending:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     completed:
 *                       type: integer
 *       500:
 *         description: Server error
 */
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const drivers = []
    const clients = []

    connectedUsers.forEach((userData, userId) => {
      if (userData.role === 'driver') {
        drivers.push({
          driverId: userId,
          location: userData.location,
          lastUpdate: userData.lastUpdate,
          online: activeDrivers.has(userId)
        })
      } else if (userData.role === 'client') {
        clients.push({
          clientId: userId,
          location: userData.location,
          lastUpdate: userData.lastUpdate
        })
      }
    })

    const stats = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      },
      drivers: {
        total: drivers.length,
        online: drivers.filter(d => d.online).length,
        locations: drivers.map(d => ({
          id: d.driverId,
          lat: d.location?.lat,
          lng: d.location?.lng,
          online: d.online
        }))
      },
      clients: {
        total: clients.length,
        locations: clients.map(c => ({
          id: c.clientId,
          lat: c.location?.lat,
          lng: c.location?.lng
        }))
      },
      rides: {
        pending: pendingRides.size,
        active: Array.from(pendingRides.values()).filter(ride => ride.status === 'accepted').length,
        completed: Array.from(pendingRides.values()).filter(ride => ride.status === 'completed').length
      },
      websocket: {
        connected: io.sockets.sockets.size,
        external: externalIo.sockets?.sockets?.size || 0
      }
    }

    res.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @swagger
 * /api/drivers/connect:
 *   post:
 *     summary: Connect/register a driver with location
 *     description: Register a new driver or update existing driver location and status. Useful for driver onboarding and initial location setup.
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *               - lat
 *               - lng
 *             properties:
 *               driverId:
 *                 type: string
 *                 description: Unique driver identifier
 *               lat:
 *                 type: number
 *                 description: Driver's current latitude coordinate
 *               lng:
 *                 type: number
 *                 description: Driver's current longitude coordinate
 *               status:
 *                 type: string
 *                 enum: [online, offline]
 *                 default: online
 *                 description: Driver availability status
 *               name:
 *                 type: string
 *                 description: Driver's display name (optional)
 *               vehicleType:
 *                 type: string
 *                 description: Type of vehicle (e.g., sedan, SUV, luxury)
 *               licensePlate:
 *                 type: string
 *                 description: Vehicle license plate number
 *     responses:
 *       200:
 *         description: Driver connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Driver connected successfully"
 *                 driver:
 *                   type: object
 *                   properties:
 *                     driverId:
 *                       type: string
 *                     location:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *                     status:
 *                       type: string
 *                     connectedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
app.post('/api/drivers/connect', (req, res) => {
  try {
    const { driverId, lat, lng, status = 'online', name, vehicleType, licensePlate } = req.body

    // Validate required fields
    if (!driverId || lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['driverId', 'lat', 'lng']
      })
    }

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'lat and lng must be numbers'
      })
    }

    // Validate status
    if (!['online', 'offline'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be either "online" or "offline"'
      })
    }

    // Store/update driver data
    const driverData = {
      driverId,
      location: { lat, lng },
      role: 'driver',
      status,
      name: name || driverId,
      vehicleType: vehicleType || 'standard',
      licensePlate: licensePlate || null,
      connectedAt: new Date().toISOString(),
      lastUpdate: Date.now()
    }

    connectedUsers.set(driverId, driverData)

    // Update active drivers set based on status
    if (status === 'online') {
      activeDrivers.add(driverId)

      // Notify all clients about available drivers
      io.emit('driversAvailable', Array.from(activeDrivers))

      // Notify external services
      externalIo.emit('driverStatusChange', {
        driverId,
        status: 'online',
        timestamp: new Date().toISOString()
      })

      // Notify external services about driver location
      externalIo.emit('driverLocationUpdate', {
        driverId,
        location: { lat, lng },
        lastUpdate: new Date().toISOString()
      })

      console.log(`🚕 Driver ${driverId} connected online at ${lat}, ${lng}`)
    } else {
      activeDrivers.delete(driverId)

      // Notify external services
      externalIo.emit('driverStatusChange', {
        driverId,
        status: 'offline',
        timestamp: new Date().toISOString()
      })

      console.log(`😴 Driver ${driverId} connected offline at ${lat}, ${lng}`)
    }

    res.json({
      success: true,
      message: `Driver ${status === 'online' ? 'connected online' : 'registered offline'} successfully`,
      driver: {
        driverId,
        location: { lat, lng },
        status,
        connectedAt: driverData.connectedAt
      }
    })
  } catch (error) {
    console.error('Error connecting driver:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @swagger
 * /api/drivers/{driverId}:
 *   get:
 *     summary: Get driver information
 *     description: Retrieve information about a specific driver including location and status
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique driver identifier
 *     responses:
 *       200:
 *         description: Driver information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 driver:
 *                   type: object
 *                   properties:
 *                     driverId:
 *                       type: string
 *                     location:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *                     status:
 *                       type: string
 *                     name:
 *                       type: string
 *                     vehicleType:
 *                       type: string
 *                     licensePlate:
 *                       type: string
 *                     connectedAt:
 *                       type: string
 *                       format: date-time
 *                     lastUpdate:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */
app.get('/api/drivers/:driverId', (req, res) => {
  try {
    const { driverId } = req.params

    const driverData = connectedUsers.get(driverId)

    if (!driverData || driverData.role !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' })
    }

    res.json({
      driver: {
        driverId,
        location: driverData.location,
        status: activeDrivers.has(driverId) ? 'online' : 'offline',
        name: driverData.name,
        vehicleType: driverData.vehicleType,
        licensePlate: driverData.licensePlate,
        connectedAt: driverData.connectedAt,
        lastUpdate: new Date(driverData.lastUpdate).toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching driver:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @swagger
 * /api/drivers/{driverId}/location:
 *   put:
 *     summary: Update driver location
 *     description: Update the location of a specific driver
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique driver identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *                 description: New latitude coordinate
 *               lng:
 *                 type: number
 *                 description: New longitude coordinate
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */
app.put('/api/drivers/:driverId/location', (req, res) => {
  try {
    const { driverId } = req.params
    const { lat, lng } = req.body

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'lat and lng must be numbers'
      })
    }

    const driverData = connectedUsers.get(driverId)

    if (!driverData || driverData.role !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' })
    }

    // Update location
    driverData.location = { lat, lng }
    driverData.lastUpdate = Date.now()

    // Notify other users about location update (if online)
    if (activeDrivers.has(driverId) && driverData.socketId) {
      io.to(driverData.socketId).broadcast.emit('userLocationUpdate', {
        userId: driverId,
        location: { lat, lng },
        role: 'driver'
      })
    }

    // Notify external services about location update
    if (activeDrivers.has(driverId)) {
      externalIo.emit('driverLocationUpdate', {
        driverId,
        location: { lat, lng },
        lastUpdate: new Date().toISOString()
      })
    }

    console.log(`📍 Driver ${driverId} location updated: ${lat}, ${lng}`)

    res.json({
      success: true,
      message: 'Driver location updated successfully',
      location: { lat, lng },
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating driver location:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @swagger
 * /api/rides/notify-driver:
 *   post:
 *     summary: Notify a specific driver about a ride request
 *     description: Sends a notification to a specific driver for accepting a ride request. Useful for spawning random riders and assigning to most suitable driver.
 *     tags: [Rides]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rideId
 *               - driverId
 *               - clientId
 *               - pickupLocation
 *               - destinationLocation
 *             properties:
 *               rideId:
 *                 type: string
 *                 description: Unique ride identifier
 *               driverId:
 *                 type: string
 *                 description: Driver to notify
 *               clientId:
 *                 type: string
 *                 description: Client who requested the ride
 *               pickupLocation:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Pickup location coordinates [lat, lng]
 *               destinationLocation:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Destination coordinates [lat, lng]
 *               clientLocation:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Current client location [lat, lng]
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notification sent to driver"
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Driver not found or not available
 *       500:
 *         description: Server error
 */
app.post('/api/rides/notify-driver', (req, res) => {
  try {
    const { rideId, driverId, clientId, pickupLocation, destinationLocation, clientLocation } = req.body

    // Validate required fields
    if (!rideId || !driverId || !clientId || !pickupLocation || !destinationLocation) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['rideId', 'driverId', 'clientId', 'pickupLocation', 'destinationLocation']
      })
    }

    // Check if driver is available
    if (!activeDrivers.has(driverId)) {
      return res.status(404).json({ error: 'Driver not available' })
    }

    const driverData = connectedUsers.get(driverId)
    if (!driverData || !driverData.socketId) {
      return res.status(404).json({ error: 'Driver not connected' })
    }

    // Store the ride request
    pendingRides.set(rideId, {
      rideId,
      clientId,
      pickupLocation,
      destinationLocation,
      clientLocation: clientLocation || pickupLocation,
      status: 'pending',
      requestedAt: Date.now()
    })

    // Send notification to specific driver
    const rideData = {
      id: rideId,
      userId: clientId,
      pickup: `${pickupLocation[0].toFixed(4)}, ${pickupLocation[1].toFixed(4)}`,
      destination: `${destinationLocation[0].toFixed(4)}, ${destinationLocation[1].toFixed(4)}`,
      location: pickupLocation
    }

    io.to(driverData.socketId).emit('rideRequest', rideData)

    console.log(`📤 Sent ride notification to driver ${driverId} for ride ${rideId}`)

    res.json({
      success: true,
      message: 'Notification sent to driver'
    })
  } catch (error) {
    console.error('Error notifying driver:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get server health status and statistics
 *     description: Returns current server status, number of connected users, active drivers, and pending rides
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 connectedUsers:
 *                   type: integer
 *                   description: Number of currently connected users
 *                 activeDrivers:
 *                   type: integer
 *                   description: Number of currently online drivers
 *                 pendingRides:
 *                   type: integer
 *                   description: Number of rides waiting for driver acceptance
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Server timestamp
 *       500:
 *         description: Server error
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    connectedUsers: connectedUsers.size,
    activeDrivers: activeDrivers.size,
    pendingRides: pendingRides.size,
    timestamp: new Date().toISOString()
  })
})

/**
 * @swagger
 * components:
 *   schemas:
 *     Driver:
 *       type: object
 *       properties:
 *         driverId:
 *           type: string
 *           description: Unique driver identifier
 *         location:
 *           type: object
 *           properties:
 *             lat:
 *               type: number
 *               description: Latitude coordinate
 *             lng:
 *               type: number
 *               description: Longitude coordinate
 *         lastUpdate:
 *           type: string
 *           format: date-time
 *           description: Last location update timestamp
 *
 *   tags:
 *     - name: Drivers
 *       description: Driver management endpoints
 *     - name: Rides
 *       description: Ride management endpoints
 *     - name: Health
 *       description: Server health monitoring
 *
 * info:
 *   title: Taxi App Backend API
 *   version: 1.0.0
 *   description: |
 *     API documentation for Taxi App Backend with Socket.IO real-time communication.
 *
 *     ## WebSocket Events
 *
 *     ### Main Namespace (/)
 *
 *     #### Client Events
 *     - `updateLocation`: Update user/driver location
 *     - `driverOnline`: Driver goes online
 *     - `driverOffline`: Driver goes offline
 *     - `requestRide`: Client requests a ride
 *     - `acceptRide`: Driver accepts a ride
 *     - `rejectRide`: Driver rejects a ride
 *     - `cancelRide`: Client cancels a ride
 *     - `completeRide`: Driver completes a ride
 *
 *     #### Server Events
 *     - `userLocationUpdate`: User location updates
 *     - `driversAvailable`: List of available drivers
 *     - `rideRequest`: New ride request to drivers
 *     - `rideAccepted`: Ride accepted notification to client
 *     - `rideCompleted`: Ride completed notification to client
 *     - `rideCancelled`: Ride cancelled notification to drivers
 *
 *     ### External Services Namespace (/external)
 *
 *     #### Server Events to External Services
 *     - `initialData`: Initial data when connecting
 *     - `driverLocationUpdate`: Real-time driver location updates
 *     - `driverStatusChange`: Driver online/offline status changes
 *     - `rideCreated`: New ride request created
 *     - `rideAccepted`: Ride accepted by driver
 *     - `rideCompleted`: Ride completed
 *
 *     #### Client Events from External Services
 *     - `requestDriverLocation`: Request specific driver location
 *
 *     #### Server Responses to External Services
 *     - `driverLocation`: Specific driver location data
 *     - `driverNotFound`: Driver not found response
 */

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
  console.log(`📊 Monitoring Dashboard: http://localhost:${PORT}/monitoring`)
  console.log(`🔗 Frontend WebSocket: ws://localhost:${PORT}`)
  console.log(`🔗 External Services WebSocket: ws://localhost:${PORT}/external`)
  console.log(`🚕 Driver Connect: http://localhost:${PORT}/api/drivers/connect`)
  console.log(`🚕 Driver Info: http://localhost:${PORT}/api/drivers/{driverId}`)
  console.log(`🚕 Driver Location: http://localhost:${PORT}/api/drivers/{driverId}/location`)
  console.log(`🚕 All Drivers: http://localhost:${PORT}/api/drivers`)
  console.log(`🚕 Clients Info: http://localhost:${PORT}/api/clients`)
  console.log(`🚕 Notify Driver: http://localhost:${PORT}/api/rides/notify-driver`)
})
