import React, { useState } from 'react'
import vx from '@nk4dev/vx'

export default function App() {
  const [block, setBlock] = useState<number | null>(null)
  const [fees, setFees] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const rpc = vx.getRpcUrl()
      const b = await vx.getBlockNumber(rpc)
      const g = await vx.getGasFees(rpc)
      setBlock(b)
      setFees(g)
    } catch (e) {
      console.error(e)
      setFees({ error: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">VX React Template</h1>
        <p className="mb-4">A minimal Vite+React+Tailwind project that demonstrates using the VX SDK programmatically.</p>
        <div className="mb-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={fetchData} disabled={loading}>
            {loading ? 'Loading…' : 'Fetch RPC Data'}
          </button>
        </div>
        <div className="space-y-3">
          <div className="rounded p-3 bg-white shadow">
            <strong>Latest block:</strong>
            <div>{block ?? '—'}</div>
          </div>
          <div className="rounded p-3 bg-white shadow">
            <strong>Gas fees (gwei):</strong>
            <pre className="text-xs overflow-auto">{fees ? JSON.stringify(fees, null, 2) : '—'}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
