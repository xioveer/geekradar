import './css/styles.css'
import { initUI } from './ui/ui.js'
import { initAuth, onAuthChange } from './auth/auth.js'
import { initChat } from './chat/chat.js'
import { initMap, searchNearby } from './map/map.js'
import { initAnalytics } from './lib/analytics.js'

function renderUserBadge(user) {
  const badge = document.getElementById('user-badge')
  const authTrigger = document.getElementById('open-auth-btn')
  if (!badge) return

  if (!user) {
    badge.classList.add('is-hidden')
    authTrigger?.classList.remove('is-hidden')
    return
  }

  authTrigger?.classList.add('is-hidden')
  badge.classList.remove('is-hidden')
  badge.querySelector('.role').textContent = user.role || 'Explorer Geek'
  badge.querySelector('.level').textContent = `Nivel ${user.level ?? 1}`
}

async function wireFilters(mapState) {
  const applyBtn = document.querySelector('.btn-apply')
  const categoryItems = document.querySelectorAll('.cat-item')
  const searchInput = document.querySelector('.search-container input')

  applyBtn?.addEventListener('click', () => searchNearby(mapState))

  categoryItems.forEach((item) => {
    item.addEventListener('click', () => {
      categoryItems.forEach((i) => i.classList.remove('active'))
      item.classList.add('active')
      searchNearby(mapState)
    })
  })

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchNearby(mapState)
  })
}

async function bootstrap() {
  initAnalytics()
  initUI()
  initAuth()
  initChat()
  onAuthChange(renderUserBadge)

  const mapState = await initMap('map')
  await wireFilters(mapState)

  // Primer barrido del radar al cargar, para que el mapa no arranque vacío.
  if (mapState) searchNearby(mapState)
}

document.addEventListener('DOMContentLoaded', bootstrap)
