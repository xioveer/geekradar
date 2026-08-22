import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { openModal, closeModal } from '../ui/ui.js'

const DEMO_SESSION_KEY = 'geekradar.demoSession'
const RATE_LIMIT_KEY = 'geekradar.authAttempts'
const MAX_ATTEMPTS = 5
const BASE_LOCKOUT_MS = 4000

let currentUser = null
const listeners = new Set()

function readAttempts() {
  try {
    return JSON.parse(sessionStorage.getItem(RATE_LIMIT_KEY)) ?? { count: 0, lockedUntil: 0 }
  } catch {
    return { count: 0, lockedUntil: 0 }
  }
}

function writeAttempts(state) {
  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state))
}

function registerFailedAttempt() {
  const state = readAttempts()
  state.count += 1
  if (state.count >= MAX_ATTEMPTS) {
    // Backoff exponencial visual: cada intento extra duplica la espera.
    const extra = state.count - MAX_ATTEMPTS
    state.lockedUntil = Date.now() + BASE_LOCKOUT_MS * 2 ** extra
  }
  writeAttempts(state)
  return state
}

function clearAttempts() {
  sessionStorage.removeItem(RATE_LIMIT_KEY)
}

function msLockedRemaining() {
  const { lockedUntil } = readAttempts()
  return Math.max(0, lockedUntil - Date.now())
}

/** Wipe every credential/session trace this app ever wrote to sessionStorage. */
function wipeSessionStorage() {
  sessionStorage.removeItem(DEMO_SESSION_KEY)
  sessionStorage.removeItem(RATE_LIMIT_KEY)
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith('geekradar.'))
    .forEach((key) => sessionStorage.removeItem(key))
}

function notify() {
  listeners.forEach((fn) => fn(currentUser))
}

export function onAuthChange(fn) {
  listeners.add(fn)
  fn(currentUser)
  return () => listeners.delete(fn)
}

export function getCurrentUser() {
  return currentUser
}

function setLockoutUI(form, remainingMs) {
  const submitBtn = form.querySelector('[type="submit"]')
  const feedback = form.querySelector('.auth-feedback')
  if (!submitBtn) return

  if (remainingMs <= 0) {
    submitBtn.disabled = false
    submitBtn.textContent = form.dataset.defaultLabel || submitBtn.textContent
    return
  }

  submitBtn.disabled = true
  form.dataset.defaultLabel = form.dataset.defaultLabel || submitBtn.textContent
  const tick = () => {
    const left = msLockedRemaining()
    if (left <= 0) {
      submitBtn.disabled = false
      submitBtn.textContent = form.dataset.defaultLabel
      if (feedback) feedback.textContent = ''
      return
    }
    submitBtn.textContent = `Espera ${Math.ceil(left / 1000)}s`
    if (feedback) {
      feedback.textContent = 'Demasiados intentos fallidos. Rate limiting activo por seguridad.'
      feedback.classList.add('is-error')
    }
    requestAnimationFrame(() => setTimeout(tick, 250))
  }
  tick()
}

async function handleLogin(form) {
  const email = form.querySelector('[name="email"]').value.trim()
  const password = form.querySelector('[name="password"]').value
  const feedback = form.querySelector('.auth-feedback')

  const remaining = msLockedRemaining()
  if (remaining > 0) {
    setLockoutUI(form, remaining)
    return
  }

  if (feedback) {
    feedback.textContent = ''
    feedback.classList.remove('is-error')
  }

  if (!isSupabaseConfigured) {
    // Modo demo: no hay backend real, se simula una sesión local.
    currentUser = { email, isDemo: true, level: 8, role: 'Explorer Geek' }
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(currentUser))
    clearAttempts()
    notify()
    closeModal('auth-modal')
    return
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const state = registerFailedAttempt()
    if (feedback) {
      feedback.textContent =
        state.count >= MAX_ATTEMPTS
          ? 'Demasiados intentos fallidos. Rate limiting activo por seguridad.'
          : error.message
      feedback.classList.add('is-error')
    }
    setLockoutUI(form, msLockedRemaining())
    return
  }

  clearAttempts()
  currentUser = data.user
  notify()
  closeModal('auth-modal')
}

async function handleRegister(form) {
  const email = form.querySelector('[name="email"]').value.trim()
  const password = form.querySelector('[name="password"]').value
  const feedback = form.querySelector('.auth-feedback')

  if (feedback) {
    feedback.textContent = ''
    feedback.classList.remove('is-error')
  }

  if (!isSupabaseConfigured) {
    currentUser = { email, isDemo: true, level: 1, role: 'Novato Geek' }
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(currentUser))
    notify()
    closeModal('auth-modal')
    return
  }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    if (feedback) {
      feedback.textContent = error.message
      feedback.classList.add('is-error')
    }
    return
  }

  currentUser = data.user
  notify()
  closeModal('auth-modal')
}

export async function logout() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut()
  }
  currentUser = null
  wipeSessionStorage()
  notify()
}

async function restoreSession() {
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession()
    currentUser = data.session?.user ?? null
    if (currentUser) notify()
    supabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user ?? null
      notify()
    })
    return
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem(DEMO_SESSION_KEY))
    if (stored) {
      currentUser = stored
      notify()
    }
  } catch {
    // sessionStorage corrupta o inaccesible: se ignora y queda deslogueado.
  }
}

export function initAuth() {
  restoreSession()

  const loginForm = document.getElementById('login-form')
  const registerForm = document.getElementById('register-form')
  const logoutBtn = document.getElementById('logout-btn')
  const openLoginBtn = document.getElementById('open-auth-btn')
  const switchToRegister = document.getElementById('switch-to-register')
  const switchToLogin = document.getElementById('switch-to-login')

  openLoginBtn?.addEventListener('click', () => openModal('auth-modal'))

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault()
    handleLogin(loginForm)
  })

  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault()
    handleRegister(registerForm)
  })

  logoutBtn?.addEventListener('click', () => logout())

  switchToRegister?.addEventListener('click', (e) => {
    e.preventDefault()
    loginForm.classList.add('is-hidden')
    registerForm.classList.remove('is-hidden')
  })

  switchToLogin?.addEventListener('click', (e) => {
    e.preventDefault()
    registerForm.classList.add('is-hidden')
    loginForm.classList.remove('is-hidden')
  })
}
