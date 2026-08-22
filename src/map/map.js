import { playSonarAt, revealMarkers } from './sonar.js'

const DEFAULT_CENTER = { lat: 10.9685, lng: -74.7813 } // Barranquilla
const SAMPLE_PLACES = [
  { name: 'Pixel Burger', emoji: '🍔🎮', position: { lat: 10.9685, lng: -74.7813 } },
  { name: 'Coffee & Games', emoji: '☕♟️', position: { lat: 10.9715, lng: -74.7845 } },
  { name: 'Pixel Arena', emoji: '🕹️🏆', position: { lat: 10.965, lng: -74.778 } }
]

let scriptPromise = null

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    window.__geekradarMapsReady = () => resolve(window.google)
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&callback=__geekradarMapsReady&v=weekly`
    script.async = true
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps JS API'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

async function createMarker(google, map, place) {
  const pin = document.createElement('div')
  pin.className = 'map-marker-pin'
  pin.textContent = place.emoji
  pin.title = place.name

  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
  return new AdvancedMarkerElement({
    map,
    position: place.position,
    content: pin,
    title: place.name
  })
}

/**
 * Inicializa el mapa. Si no hay API key configurada, degrada a un
 * mensaje informativo en vez de romper el resto de la app.
 */
export async function initMap(containerId) {
  const container = document.getElementById(containerId)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    container.innerHTML = `
      <div class="map-fallback">
        <p>Configura <code>VITE_GOOGLE_MAPS_API_KEY</code> en tu <code>.env</code> para activar el mapa.</p>
      </div>`
    return null
  }

  const google = await loadGoogleMaps(apiKey)
  const map = new google.maps.Map(container, {
    center: DEFAULT_CENTER,
    zoom: 14,
    mapId: 'GEEKRADAR_DARK',
    disableDefaultUI: true,
    zoomControl: true
  })

  const markers = []
  for (const place of SAMPLE_PLACES) {
    markers.push(await createMarker(google, map, place))
  }
  markers.forEach((marker) => {
    marker.content.style.opacity = '0'
  })

  return { google, map, markers, userPosition: DEFAULT_CENTER }
}

/**
 * Punto de entrada para filtros/búsqueda: dispara el efecto sonar en la
 * ubicación del usuario y, al terminar, revela los marcadores del mapa.
 */
export async function searchNearby(mapState) {
  if (!mapState) return
  const { google, map, markers, userPosition } = mapState
  const position = new google.maps.LatLng(userPosition.lat, userPosition.lng)

  await playSonarAt(map, position)
  revealMarkers(markers)
}
