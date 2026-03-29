import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Camera } from '../types'

interface Props {
  onSetup: () => void
}

function StateBadge({ state }: { state: Camera['state'] }) {
  const detected = state === 'detected'
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 9999,
      fontSize: '0.72rem',
      fontWeight: 700,
      background: detected ? 'var(--detected)' : 'var(--idle)',
      color: detected ? '#000' : 'var(--text-muted)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {detected ? 'Detected' : 'Idle'}
    </span>
  )
}

function CameraCard({ camera, onDelete }: { camera: Camera; onDelete: (id: string) => void }) {
  const [imgKey, setImgKey] = useState(0)
  const [deleting, setDeleting] = useState(false)

  // Refresh image when lastImageTs changes
  useEffect(() => {
    setImgKey(k => k + 1)
  }, [camera.lastImageTs])

  const handleDelete = async () => {
    if (!confirm(`Remove "${camera.friendlyName}" from hawkeye2ha?`)) return
    setDeleting(true)
    try {
      await api.deleteCamera(camera.id)
      onDelete(camera.id)
    } catch (e) {
      alert(`Failed to remove camera: ${e}`)
      setDeleting(false)
    }
  }

  const formattedTs = camera.lastImageTs
    ? new Date(camera.lastImageTs).toLocaleString()
    : 'No image yet'

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${camera.state === 'detected' ? 'var(--detected)' : 'var(--border)'}`,
      borderRadius: 10,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.3s',
    }}>
      {/* Image area */}
      <div style={{ position: 'relative', background: '#0a0d14', aspectRatio: '16/9' }}>
        {camera.lastImageTs ? (
          <img
            key={imgKey}
            src={`${api.cameraImageUrl(camera.id)}?t=${imgKey}`}
            alt={camera.friendlyName}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: '0.82rem',
          }}>
            Waiting for first image…
          </div>
        )}
        {/* Timestamp overlay */}
        <div style={{
          position: 'absolute', bottom: 6, right: 8,
          background: 'rgba(0,0,0,0.6)', color: '#ccc',
          fontSize: '0.68rem', padding: '2px 6px', borderRadius: 4,
        }}>
          {formattedTs}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {camera.friendlyName}
          </span>
          <StateBadge state={camera.state} />
        </div>

        {/* Detected objects */}
        {camera.detectedObjects.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {camera.detectedObjects.map(obj => (
              <span key={obj} style={{
                background: 'var(--bg-card2)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '1px 7px', fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}>
                {obj}
              </span>
            ))}
          </div>
        )}

        {/* Timeout + delete */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Idle timeout: {camera.effectiveTimeout}s
            {camera.idleTimeoutSeconds !== null && ' (custom)'}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: 'transparent', border: '1px solid var(--danger)',
              color: 'var(--danger)', borderRadius: 5, padding: '2px 10px',
              fontSize: '0.75rem', cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.5 : 1,
            }}
          >
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage({ onSetup }: Props) {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCameras = useCallback(async () => {
    try {
      const data = await api.getCameras()
      setCameras(data)
      setError(null)
    } catch (e) {
      // On transient errors, preserve the last known camera list so the
      // dashboard doesn't blank out — just show the error banner.
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCameras()
    const id = setInterval(() => void fetchCameras(), 10_000)
    return () => clearInterval(id)
  }, [fetchCameras])

  const handleDelete = (id: string) => {
    setCameras(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Camera Dashboard</h1>
        <button
          onClick={onSetup}
          style={{
            background: 'var(--accent-dim)', border: '1px solid var(--accent)',
            color: 'var(--accent)', borderRadius: 6, padding: '0.4rem 1rem',
            fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600,
          }}
        >
          ⚙ Setup
        </button>
      </div>

      {loading && (
        <p style={{ color: 'var(--text-muted)' }}>Loading cameras…</p>
      )}

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ⚠ {error}
        </div>
      )}

      {!loading && cameras.length === 0 && !error && (
        <div style={{ textAlign: 'center', paddingTop: '3rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No cameras configured.</p>
          <button
            onClick={onSetup}
            style={{
              background: 'var(--accent)', color: '#000', border: 'none',
              borderRadius: 6, padding: '0.5rem 1.25rem',
              fontSize: '0.9rem', cursor: 'pointer', fontWeight: 700,
            }}
          >
            Go to Setup
          </button>
        </div>
      )}

      {cameras.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem',
        }}>
          {cameras.map(cam => (
            <CameraCard key={cam.id} camera={cam} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
