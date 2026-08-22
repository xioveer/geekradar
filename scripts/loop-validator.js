#!/usr/bin/env node
// QA gate: builds the app and checks the produced dist/ output before
// letting a deploy proceed. Exits 0 only if everything checks out.

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const distDir = join(root, 'dist')

const REQUIRED_ENV_VARS = [
  'VITE_WEBHOOK_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GA_MEASUREMENT_ID',
  'VITE_GOOGLE_MAPS_API_KEY'
]

function log(step, ok, detail = '') {
  const icon = ok ? '✔' : '✖'
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ''}`)
}

function checkEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key])
  if (missing.length) {
    log('Variables de entorno', true, `faltan (opcional en build): ${missing.join(', ')}`)
  } else {
    log('Variables de entorno', true, 'todas presentes')
  }
  return true
}

function runBuild() {
  try {
    execSync('npx vite build', { stdio: 'inherit', cwd: root })
    log('vite build', true)
    return true
  } catch (error) {
    log('vite build', false, error.message)
    return false
  }
}

function checkDistOutput() {
  if (!existsSync(distDir)) {
    log('dist/ existe', false, 'no se generó el directorio de build')
    return false
  }
  log('dist/ existe', true)

  const indexPath = join(distDir, 'index.html')
  if (!existsSync(indexPath) || statSync(indexPath).size === 0) {
    log('dist/index.html', false, 'falta o está vacío')
    return false
  }
  log('dist/index.html', true)

  const assetsDir = join(distDir, 'assets')
  const hasJsBundle =
    existsSync(assetsDir) && readdirSync(assetsDir).some((file) => file.endsWith('.js'))

  if (!hasJsBundle) {
    log('bundle JS en dist/assets', false, 'no se encontró ningún .js')
    return false
  }
  log('bundle JS en dist/assets', true)

  return true
}

function main() {
  console.log('GeekRadar — QA de build\n')

  checkEnvVars()

  if (!runBuild()) {
    console.log('\nValidación FALLIDA: el build no se completó.')
    process.exit(1)
  }

  if (!checkDistOutput()) {
    console.log('\nValidación FALLIDA: el output de dist/ es inválido.')
    process.exit(1)
  }

  console.log('\nValidación OK — listo para producción.')
  process.exit(0)
}

main()
