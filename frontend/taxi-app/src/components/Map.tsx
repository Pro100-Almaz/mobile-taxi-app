import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Add custom CSS for markers
const customMarkerStyles = `
  .custom-marker {
    border: none !important;
    background: transparent !important;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = customMarkerStyles
  document.head.appendChild(style)
}

// Fix for default markers in Leaflet - ensure default icon works
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
} catch (error) {
  console.warn('Failed to set up default Leaflet icon:', error)
}

// Create custom icons dynamically to avoid initialization issues
const createCustomIcon = (color: string) => {
  try {
    // Use a more reliable approach - create div-based colored markers
    const iconHtml = `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
    "></div>`

    return L.divIcon({
      html: iconHtml,
      className: 'custom-marker',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    })
  } catch (error) {
    console.warn('Failed to create custom icon, using default:', error)
    return new L.Icon.Default()
  }
}

interface Location {
  lat: number
  lng: number
  label?: string
  type?: 'pickup' | 'destination' | 'current'
}

interface MapProps {
  center?: [number, number]
  zoom?: number
  markers?: Location[]
  height?: string
  onLocationSelect?: (lat: number, lng: number) => void
  selectable?: boolean
}

const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])

  return null
}

const MapClickHandler: React.FC<{ onLocationSelect?: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

const Map: React.FC<MapProps> = ({
  center = [51.505, -0.09], // Default to London
  zoom = 13,
  markers = [],
  height = '400px',
  onLocationSelect,
  selectable = false
}) => {
  const [mapReady, setMapReady] = React.useState(false)

  useEffect(() => {
    // Ensure Leaflet is ready before rendering markers
    const timer = setTimeout(() => {
      setMapReady(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])
  const getMarkerIcon = (type?: string) => {
    switch (type) {
      case 'pickup':
        return createCustomIcon('#4caf50') // Green
      case 'destination':
        return createCustomIcon('#f44336') // Red
      case 'current':
        return createCustomIcon('#2196f3') // Blue for current location
      default:
        // Fallback to a safe default icon
        try {
          return new L.Icon.Default()
        } catch (error) {
          console.warn('Failed to create default icon, using fallback:', error)
          return createCustomIcon('#757575') // Gray fallback
        }
    }
  }

  return (
    <div style={{ height, width: '100%', cursor: selectable ? 'crosshair' : 'default' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />
        {selectable && <MapClickHandler onLocationSelect={onLocationSelect} />}
        {mapReady && markers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.lat, marker.lng]}
            icon={getMarkerIcon(marker.type)}
          >
            <Popup>{marker.label || `${marker.type || 'Location'} ${index + 1}`}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default Map
