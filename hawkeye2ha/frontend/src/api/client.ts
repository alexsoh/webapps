import type { AppConfig, Camera, DiscoverInfo, InstallRequest, InstallResult } from '../types'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getConfig: () => request<AppConfig>('GET', '/api/config'),
  updateConfig: (data: Partial<AppConfig>) => request<{ status: string }>('PUT', '/api/config', data),

  getCameras: () => request<Camera[]>('GET', '/api/cameras'),
  updateCamera: (id: string, data: { idleTimeoutSeconds: number | null }) =>
    request<{ status: string }>('PUT', `/api/cameras/${id}`, data),
  deleteCamera: (id: string) => request<{ status: string }>('DELETE', `/api/cameras/${id}`),
  cameraImageUrl: (id: string) => `/api/cameras/${id}/image`,

  discover: () => request<DiscoverInfo>('GET', '/api/discover'),
  install: (body: InstallRequest) => request<InstallResult>('POST', '/api/install', body),
}
