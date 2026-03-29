import { useState } from 'react'
import DashboardPage from './pages/DashboardPage'
import SetupPage from './pages/SetupPage'

type Page = 'dashboard' | 'setup'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={{
        width: 200,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 0',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 1.25rem 1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>hawkeye2ha</span>
        </div>
        {(['dashboard', 'setup'] as Page[]).map(p => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              background: page === p ? 'var(--accent-dim)' : 'transparent',
              border: 'none',
              color: page === p ? 'var(--accent)' : 'var(--text-muted)',
              textAlign: 'left',
              padding: '0.6rem 1.25rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: page === p ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {p === 'dashboard' ? '⊞ Dashboard' : '⚙ Setup'}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        {page === 'dashboard' && <DashboardPage onSetup={() => setPage('setup')} />}
        {page === 'setup' && <SetupPage />}
      </main>
    </div>
  )
}
