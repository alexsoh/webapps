export interface Camera {
  id: string
  friendlyName: string
  topic: string
  state: 'detected' | 'idle'
  detectedObjects: string[]
  lastImageTs: string | null
  idleTimeoutSeconds: number | null
  effectiveTimeout: number
}

export interface AppConfig {
  hawkeye2Url: string
  hawkeye2Port: number
  topicPrefix: string
  idleTimeoutSeconds: number
}

export interface DiscoverCamera {
  id: string
  friendlyName: string
  enabled: boolean
}

export interface DiscoverInfo {
  mqtt: {
    broker: string
    port: number
    username: string
    password: string
    enabled: boolean
  }
  cameras: DiscoverCamera[]
}

export interface InstallRequest {
  topicPrefix: string
  selected: string[]
  deselected: string[]
}

export interface InstallResult {
  status: string
  setupErrors: { cameraId: string; error: string }[]
  cleanupErrors: { cameraId: string; error: string }[]
}
