import { apiFetch } from './client'

// Example endpoint wrapper — copy this pattern for each new backend endpoint.
// Paths are relative to the /api prefix (see vite.config.ts proxy), so apiFetch('/')
// reaches GET /api on the backend. The current NestJS starter has no /api routes yet,
// so this returns 404 until real endpoints are added.

export async function getRoot(): Promise<string> {
  return apiFetch<string>('/')
}
