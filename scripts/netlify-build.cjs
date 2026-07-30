/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

function ensureDatabaseUrlSchema(databaseUrl) {
  const parsedUrl = new URL(databaseUrl)

  if (!parsedUrl.searchParams.get('schema')) {
    parsedUrl.searchParams.set('schema', 'pa2')
  }

  return parsedUrl.toString()
}

function loadDotEnvIfPresent() {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    return
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const rawLine of envContent.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, '$1')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadDotEnvIfPresent()

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured for Netlify build')
}

process.env.DATABASE_URL = ensureDatabaseUrlSchema(process.env.DATABASE_URL)

console.info(
  '[netlify-build] using DATABASE_URL with schema',
  new URL(process.env.DATABASE_URL).searchParams.get('schema'),
)

execSync('npx prisma db push', {
  stdio: 'inherit',
  env: process.env,
})

execSync('npm run build', {
  stdio: 'inherit',
  env: process.env,
})
