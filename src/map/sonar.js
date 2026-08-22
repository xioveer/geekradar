import { gsap } from 'gsap'

let SonarOverlay = null

/**
 * Construye la clase overlay perezosamente: `google` solo existe una vez
 * que el script de Google Maps terminó de cargar, así que no podemos
 * hacer `extends google.maps.OverlayView` a nivel de módulo.
 */
function getSonarOverlayClass() {
  if (SonarOverlay) return SonarOverlay

  SonarOverlay = class extends google.maps.OverlayView {
    constructor(position) {
      super()
      this.position = position
      this.el = document.createElement('div')
      this.el.className = 'sonar-overlay'
      this.el.innerHTML = `
        <span class="sonar-ring"></span>
        <span class="sonar-ring"></span>
        <span class="sonar-ring"></span>
        <span class="sonar-dot"></span>
      `
    }

    onAdd() {
      this.getPanes().overlayMouseTarget.appendChild(this.el)
    }

    draw() {
      const projection = this.getProjection()
      if (!projection) return
      const point = projection.fromLatLngToDivPixel(this.position)
      this.el.style.left = `${point.x}px`
      this.el.style.top = `${point.y}px`
    }

    onRemove() {
      this.el.remove()
    }
  }

  return SonarOverlay
}

/**
 * Efecto sonar/radar: ondas concéntricas expandiéndose desde la ubicación
 * del usuario antes de revelar los marcadores del mapa. Devuelve una
 * promesa que resuelve cuando la animación termina.
 */
export function playSonarAt(map, position) {
  return new Promise((resolve) => {
    const Overlay = getSonarOverlayClass()
    const overlay = new Overlay(position)
    overlay.setMap(map)

    // Espera a que el overlay esté montado y posicionado antes de animar.
    requestAnimationFrame(() => {
      const rings = overlay.el.querySelectorAll('.sonar-ring')
      const tl = gsap.timeline({
        onComplete: () => {
          overlay.setMap(null)
          resolve()
        }
      })

      gsap.set(rings, { scale: 0, autoAlpha: 0.9 })
      gsap.set(overlay.el.querySelector('.sonar-dot'), { scale: 0 })

      tl.to(overlay.el.querySelector('.sonar-dot'), {
        scale: 1,
        duration: 0.2,
        ease: 'back.out(3)'
      })

      rings.forEach((ring, i) => {
        tl.to(
          ring,
          {
            scale: 6,
            autoAlpha: 0,
            duration: 1.1,
            ease: 'power2.out'
          },
          i * 0.28
        )
      })

      tl.to({}, { duration: 0.15 })
    })
  })
}

/** Revela marcadores en cascada, como si aparecieran detectados por el radar. */
export function revealMarkers(markers) {
  const els = markers.map((marker) => marker.getElement?.() || marker.content).filter(Boolean)
  if (!els.length) return
  gsap.fromTo(
    els,
    { scale: 0, autoAlpha: 0, y: -12 },
    {
      scale: 1,
      autoAlpha: 1,
      y: 0,
      duration: 0.4,
      ease: 'back.out(2.2)',
      stagger: 0.08
    }
  )
}
