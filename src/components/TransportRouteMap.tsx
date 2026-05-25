import { decode } from '@googlemaps/polyline-codec'
import { useEffect, useMemo } from 'react'
import {
  APIProvider,
  Map,
  Marker,
  Polyline,
  useMap,
} from '@vis.gl/react-google-maps'

import { getGoogleMapsApiKey, isGoogleMapsConfigured } from '../lib/googleMapsConfig'

type LatLng = { lat: number; lng: number }

function FitBounds({
  points,
  padding = 48,
}: {
  points: LatLng[]
  padding?: number
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || points.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    for (const point of points) {
      bounds.extend(point)
    }
    map.fitBounds(bounds, padding)
  }, [map, points, padding])

  return null
}

function TransportRouteMapInner({
  encodedPolyline,
  origin,
  destination,
}: {
  encodedPolyline?: string
  origin: LatLng
  destination: LatLng
}) {
  const path = useMemo(() => {
    if (!encodedPolyline) return []
    try {
      return decode(encodedPolyline).map(([lat, lng]) => ({ lat, lng }))
    } catch {
      return []
    }
  }, [encodedPolyline])

  const center = useMemo(
    () => ({
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng + destination.lng) / 2,
    }),
    [origin, destination],
  )

  const fitPoints = path.length > 0 ? path : [origin, destination]

  return (
    <Map
      defaultCenter={center}
      defaultZoom={path.length > 0 ? 10 : 3}
      gestureHandling="cooperative"
      disableDefaultUI
      className="h-full w-full"
    >
      <FitBounds points={fitPoints} />
      {path.length > 0 && (
        <Polyline path={path} strokeColor="#2563eb" strokeWeight={4} />
      )}
      <Marker position={origin} title="Start" />
      <Marker position={destination} title="End" />
    </Map>
  )
}

export function TransportRouteMap({
  encodedPolyline,
  startLat,
  startLon,
  endLat,
  endLon,
}: {
  encodedPolyline?: string
  startLat: number
  startLon: number
  endLat: number
  endLon: number
}) {
  if (!isGoogleMapsConfigured()) {
    return (
      <p className="px-3 py-6 text-center text-xs text-slate-500">
        Set <code className="text-slate-700">VITE_GOOGLE_MAPS_API_KEY</code> in{' '}
        <code className="text-slate-700">frontend/.env</code> to show the route map (Maps
        JavaScript API).
      </p>
    )
  }

  const origin = { lat: startLat, lng: startLon }
  const destination = { lat: endLat, lng: endLon }

  return (
    <APIProvider apiKey={getGoogleMapsApiKey()!}>
      <TransportRouteMapInner
        encodedPolyline={encodedPolyline}
        origin={origin}
        destination={destination}
      />
    </APIProvider>
  )
}
