import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { AppConfig, DiscoverCamera, DiscoverInfo } from '../types'

interface CameraRow {
  camera: DiscoverCamera
  selected: boolean
  advancedOpen: boolean
  idleTimeoutOverride: string
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  padding: '0.4rem 0.7rem',
  fontSize: '0.88rem',
  outline: 'none',
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: 4,
}

const sectionStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '1.25rem',
  marginBottom: '1.25rem',
}

function Spinner() {
  return <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
}

export default function SetupPage() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [topicPrefix, setTopicPrefix] = useState('hawkeye2ha')
  const [idleTimeout, setIdleTimeout] = useState('30')
  const [configSaving, setConfigSaving] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  const [discovering, setDiscovering] = useState(false)
  const [discoverError, setDiscoverError] = useState<string | null>(null)
  const [discoverInfo, setDiscoverInfo] = useState<DiscoverInfo | null>(null)
  const [rows, setRows] = useState<CameraRow[]>([])

  const [installing, setInstalling] = useState(false)
  const [installResult, setInstallResult] = useState<string | null>(null)
  const [installError, setInstallError] = useState<string | null>(null)

  // Load config on mount
  useEffect(() => {
    api.getConfig().then(cfg => {
      setConfig(cfg)
      setTopicPrefix(cfg.topicPrefix)
      setIdleTimeout(String(cfg.idleTimeoutSeconds))
    }).catch(() => {})
  }, [])

  const saveConfig = async () => {
    setConfigSaving(true)
    setConfigSaved(false)
    try {
      await api.updateConfig({
        topicPrefix: topicPrefix.trim() || 'hawkeye2ha',
        idleTimeoutSeconds: Math.max(5, parseInt(idleTimeout, 10) || 30),
      })
      setConfigSaved(true)
      setTimeout(() => setConfigSaved(false), 2000)
    } catch (e) {
      alert(`Save failed: ${e}`)
    } finally {
      setConfigSaving(false)
    }
  }

  const discover = async () => {
    setDiscovering(true)
    setDiscoverError(null)
    setDiscoverInfo(null)
    setInstallResult(null)
    setInstallError(null)
    try {
      const info = await api.discover()
      setDiscoverInfo(info)

      // Get currently configured cameras to pre-check
      const currentCameras = await api.getCameras()
      const configuredIds = new Set(currentCameras.map(c => c.id))
      const configuredTimeouts = Object.fromEntries(
        currentCameras.map(c => [c.id, c.idleTimeoutSeconds])
      )

      setRows(info.cameras.map(cam => ({
        camera: cam,
        selected: configuredIds.has(cam.id),
        advancedOpen: configuredTimeouts[cam.id] !== null && configuredTimeouts[cam.id] !== undefined,
        idleTimeoutOverride: String(configuredTimeouts[cam.id] ?? ''),
      })))
    } catch (e) {
      setDiscoverError(String(e))
    } finally {
      setDiscovering(false)
    }
  }

  const toggleRow = (id: string) => {
    setRows(prev => prev.map(r => r.camera.id === id ? { ...r, selected: !r.selected } : r))
  }

  const toggleAdvanced = (id: string) => {
    setRows(prev => prev.map(r => r.camera.id === id ? { ...r, advancedOpen: !r.advancedOpen } : r))
  }

  const setRowTimeout = (id: string, val: string) => {
    setRows(prev => prev.map(r => r.camera.id === id ? { ...r, idleTimeoutOverride: val } : r))
  }

  const install = async () => {
    if (!discoverInfo) return
    setInstalling(true)
    setInstallResult(null)
    setInstallError(null)

    const prefix = topicPrefix.trim() || 'hawkeye2ha'
    const allIds = rows.map(r => r.camera.id)
    const selectedIds = rows.filter(r => r.selected).map(r => r.camera.id)
    const deselectedIds = allIds.filter(id => !selectedIds.includes(id))

    try {
      const result = await api.install({
        topicPrefix: prefix,
        selected: selectedIds,
        deselected: deselectedIds,
      })

      // Apply per-camera timeout overrides
      for (const row of rows) {
        if (!row.selected) continue
        const override = row.idleTimeoutOverride.trim()
        const parsed = override ? parseInt(override, 10) : null
        const value = parsed && parsed >= 5 ? parsed : null
        try {
          await api.updateCamera(row.camera.id, { idleTimeoutSeconds: value })
        } catch (_) {}
      }

      const errors = [...result.setupErrors, ...result.cleanupErrors]
      if (errors.length > 0) {
        setInstallResult(`Done with ${errors.length} error(s): ${errors.map(e => `${e.cameraId}: ${e.error}`).join(', ')}`)
      } else {
        setInstallResult(`${selectedIds.length} camera(s) installed successfully.`)
      }
    } catch (e) {
      setInstallError(String(e))
    } finally {
      setInstalling(false)
    }
  }

  const reconfigure = discover

  const selectedCount = rows.filter(r => r.selected).length

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem', fontWeight: 700 }}>Setup</h1>

      {/* Connection info */}
      <section style={sectionStyle}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          HawkEye2 Connection
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={labelStyle}>URL</label>
            <input style={{ ...inputStyle, opacity: 0.7 }} value={config?.hawkeye2Url ?? '…'} readOnly />
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label style={labelStyle}>Port</label>
            <input style={{ ...inputStyle, opacity: 0.7 }} value={config?.hawkeye2Port ?? '…'} readOnly />
          </div>
        </div>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Change the URL and port in the add-on configuration panel.
        </p>
      </section>

      {/* Global settings */}
      <section style={sectionStyle}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Global Settings
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={labelStyle}>Topic prefix</label>
            <input
              style={inputStyle}
              value={topicPrefix}
              onChange={e => setTopicPrefix(e.target.value)}
              placeholder="hawkeye2ha"
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.71rem', color: 'var(--text-muted)' }}>
              Topics: <code style={{ color: 'var(--accent)' }}>{(topicPrefix || 'hawkeye2ha')}/{'{camera_id}'}</code>
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={labelStyle}>Idle timeout (s)</label>
            <input
              style={inputStyle}
              type="number"
              min={5}
              max={3600}
              value={idleTimeout}
              onChange={e => setIdleTimeout(e.target.value)}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.71rem', color: 'var(--text-muted)' }}>
              Default for all cameras
            </p>
          </div>
        </div>
        <button
          onClick={saveConfig}
          disabled={configSaving}
          style={{
            background: configSaved ? 'var(--detected)' : 'var(--accent)',
            color: '#000', border: 'none', borderRadius: 6,
            padding: '0.4rem 1.1rem', fontSize: '0.85rem',
            cursor: configSaving ? 'not-allowed' : 'pointer', fontWeight: 600,
            opacity: configSaving ? 0.7 : 1,
          }}
        >
          {configSaving ? 'Saving…' : configSaved ? '✓ Saved' : 'Save Settings'}
        </button>
      </section>

      {/* Discovery */}
      <section style={sectionStyle}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Camera Discovery
        </h2>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <button
            onClick={discover}
            disabled={discovering}
            style={{
              background: 'var(--accent)', color: '#000', border: 'none',
              borderRadius: 6, padding: '0.45rem 1.25rem',
              fontSize: '0.88rem', cursor: discovering ? 'not-allowed' : 'pointer',
              fontWeight: 700, opacity: discovering ? 0.7 : 1,
            }}
          >
            {discovering ? <><Spinner /> Discovering…</> : '🔍 Discover'}
          </button>

          {rows.length > 0 && (
            <button
              onClick={reconfigure}
              disabled={discovering}
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-muted)', borderRadius: 6, padding: '0.45rem 1rem',
                fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              ↺ Reconfigure
            </button>
          )}
        </div>

        {discoverError && (
          <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
            {discoverError}
          </p>
        )}

        {discoverInfo && (
          <>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              MQTT broker: <code style={{ color: 'var(--accent)' }}>
                {discoverInfo.mqtt.broker}:{discoverInfo.mqtt.port}
              </code>
            </div>

            {rows.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No cameras found in HawkEye2.</p>
            )}

            {rows.length > 0 && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' }}>
                {rows.map((row, i) => (
                  <div key={row.camera.id} style={{
                    borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    {/* Main row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.65rem 1rem',
                      background: row.selected ? 'rgba(56,189,248,0.05)' : 'transparent',
                    }}>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => toggleRow(row.camera.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)', flexShrink: 0 }}
                      />
                      <span style={{ flex: 1, fontSize: '0.9rem' }}>{row.camera.friendlyName}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {row.camera.id.slice(0, 8)}…
                      </span>
                      <button
                        onClick={() => toggleAdvanced(row.camera.id)}
                        style={{
                          background: 'transparent', border: 'none',
                          color: 'var(--text-muted)', fontSize: '0.75rem',
                          cursor: 'pointer', padding: '2px 6px',
                        }}
                      >
                        Advanced {row.advancedOpen ? '▾' : '▸'}
                      </button>
                    </div>

                    {/* Advanced collapse */}
                    {row.advancedOpen && (
                      <div style={{
                        padding: '0.65rem 1rem 0.75rem 2.75rem',
                        background: 'var(--bg-base)',
                        borderTop: '1px solid var(--border)',
                      }}>
                        <label style={labelStyle}>
                          Idle timeout override (seconds) — blank to use global default
                        </label>
                        <input
                          style={{ ...inputStyle, maxWidth: 160 }}
                          type="number"
                          min={5}
                          max={3600}
                          placeholder={`${config?.idleTimeoutSeconds ?? 30} (global)`}
                          value={row.idleTimeoutOverride}
                          onChange={e => setRowTimeout(row.camera.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {rows.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={install}
                  disabled={installing}
                  style={{
                    background: 'var(--accent)', color: '#000', border: 'none',
                    borderRadius: 6, padding: '0.5rem 1.5rem',
                    fontSize: '0.9rem', cursor: installing ? 'not-allowed' : 'pointer',
                    fontWeight: 700, opacity: installing ? 0.7 : 1,
                  }}
                >
                  {installing ? <><Spinner /> Installing…</> : `Install (${selectedCount} camera${selectedCount !== 1 ? 's' : ''})`}
                </button>

                {installResult && (
                  <span style={{ color: 'var(--detected)', fontSize: '0.85rem' }}>✓ {installResult}</span>
                )}
                {installError && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>✗ {installError}</span>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
