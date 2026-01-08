import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use port 5432 for direct connection (not pooler)
const connectionString = process.argv[2] || 'postgresql://postgres.cuhdltbrzbeonhymwdsn:BW1HaBTbce69KcZx@aws-1-sa-east-1.pooler.supabase.com:5432/postgres'
const migrationFile = process.argv[3]

if (!migrationFile) {
  console.log('Usage: node apply-migration.mjs <connection_string> <migration_file>')
  console.log('Example: node apply-migration.mjs "postgres://..." 20260109_okr_tasks.sql')
  process.exit(1)
}

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)

if (!fs.existsSync(migrationPath)) {
  console.error(`Migration file not found: ${migrationPath}`)
  process.exit(1)
}

const sql = fs.readFileSync(migrationPath, 'utf8')

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  try {
    console.log('Connecting to database...')
    await client.connect()
    console.log('Connected!')

    console.log(`Applying migration: ${migrationFile}`)
    await client.query(sql)
    console.log('Migration applied successfully!')

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await client.end()
  }
}

run()
