import { gsap } from 'gsap'
import { createIcons, icons } from 'lucide'

export function renderIcons() {
  createIcons({ icons })
}

export function openModal(id) {
  const modal = document.getElementById(id)
  if (!modal) return
  modal.classList.remove('is-hidden')

  gsap.fromTo(
    modal,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.2, ease: 'power1.out' }
  )
  gsap.fromTo(
    modal.querySelector('.modal-panel'),
    { y: 24, autoAlpha: 0, scale: 0.97 },
    { y: 0, autoAlpha: 1, scale: 1, duration: 0.32, ease: 'back.out(1.6)' }
  )
}

export function closeModal(id) {
  const modal = document.getElementById(id)
  if (!modal) return

  gsap.to(modal.querySelector('.modal-panel'), {
    y: 16,
    autoAlpha: 0,
    scale: 0.97,
    duration: 0.2,
    ease: 'power1.in'
  })
  gsap.to(modal, {
    autoAlpha: 0,
    duration: 0.22,
    ease: 'power1.in',
    onComplete: () => modal.classList.add('is-hidden')
  })
}

function wireModalDismiss() {
  document.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', () => {
      const modal = el.closest('.modal-overlay')
      if (modal) closeModal(modal.id)
    })
  })
}

function openSidePanel(panel) {
  panel.classList.add('is-open')
  gsap.fromTo(
    panel,
    { xPercent: 100 },
    { xPercent: 0, duration: 0.32, ease: 'power3.out' }
  )
}

function closeSidePanel(panel) {
  gsap.to(panel, {
    xPercent: 100,
    duration: 0.28,
    ease: 'power3.in',
    onComplete: () => panel.classList.remove('is-open')
  })
}

/** Cajones móviles: filtros y ficha de lugar se deslizan como paneles laterales. */
function wireMobileDrawers() {
  document.querySelectorAll('[data-drawer-target]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const panel = document.querySelector(trigger.dataset.drawerTarget)
      if (panel) openSidePanel(panel)
    })
  })

  document.querySelectorAll('[data-drawer-close]').forEach((closer) => {
    closer.addEventListener('click', () => {
      const panel = closer.closest('.side-drawer')
      if (panel) closeSidePanel(panel)
    })
  })
}

function wireBottomNav() {
  const items = document.querySelectorAll('.bottom-nav .bottom-nav-item')
  items.forEach((item) => {
    item.addEventListener('click', () => {
      items.forEach((i) => i.classList.remove('active'))
      item.classList.add('active')
      gsap.fromTo(item, { scale: 0.85 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' })
    })
  })
}

export function initUI() {
  renderIcons()
  wireModalDismiss()
  wireMobileDrawers()
  wireBottomNav()
}
