const DEFAULT_DATABASE_SCHEMA = 'pa2'

export function ensureDatabaseUrlSchema(databaseUrl: string) {
  const parsedUrl = new URL(databaseUrl)

  if (!parsedUrl.searchParams.get('schema')) {
    parsedUrl.searchParams.set('schema', DEFAULT_DATABASE_SCHEMA)
  }

  return parsedUrl.toString()
}

export { DEFAULT_DATABASE_SCHEMA }
