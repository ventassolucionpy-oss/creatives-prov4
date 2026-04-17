'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import ResultsPanel from '@/components/tools/ResultsPanel'
import type { Generation, GenerationOutput } from '@/types'

const toolLabels: Record<string, { label: string; color: string; icon: string }> = {
  'ugc-anuncios': { label: 'UGC Anuncios', color: 'tag-purple', icon: '✦' },
  'ugc-secuencias': { label: 'UGC Secuencias', color: 'tag-blue', icon: '▤' },
  'ugc-catalogo': { label: 'UGC Catálogo', color: 'tag-green', icon: '⊞' },
  'meta-ads': { label: 'Meta Ads', color: 'tag-blue', icon: 'M' },
  'tiktok': { label: 'TikTok', color: 'tag-gray', icon: '♪' },
  'hotmart': { label: 'Hotmart', color: 'tag-gold', icon: 'H' },
}

type GenerationWithProduct = Generation & { products?: { name: string } }

function GenerationDetail({ generation, onBack }: { generation: GenerationWithProduct; onBack: () => void }) {
  const tool = toolLabels[generation.tool] || { label: generation.tool, color: 'tag-gray', icon: '✦' }
  const output = generation.output as GenerationOutput | undefined

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost text-white/30 hover:text-white p-1.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`tag ${tool.color} text-[10px]`}>{tool.label}</span>
            <span className="tag tag-green text-[10px]">Completado</span>
          </div>
          <p className="text-white/40 text-xs">
            {generation.products?.name || 'Sin producto'} · {new Date(generation.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {output ? (
        <ResultsPanel output={output} tool={generation.tool} />
      ) : (
        <div className="card p-8 text-center">
          <p className="text-white/30 text-sm">No hay contenido guardado para esta generación.</p>
        </div>
      )}

      {/* Input params used */}
      {generation.input && Object.keys(generation.input).length > 0 && (
        <div className="card p-4 mt-4">
          <p className="text-xs text-white/30 font-semibold mb-3 uppercase tracking-wider">Parámetros usados</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(generation.input as Record<string, unknown>)
              .filter(([k, v]) => v && !['product_id', 'tool'].includes(k))
              .map(([k, v]) => (
                <div key={k} className="bg-white/5 rounded-lg px-2.5 py-1.5">
                  <p className="text-white/30 text-[10px] capitalize">{k.replace(/_/g, ' ')}</p>
                  <p className="text-white/70 text-xs">{String(v).length > 40 ? String(v).slice(0, 40) + '…' : String(v)}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <button onClick={onBack} className="btn-secondary w-full">← Volver al historial</button>
      </div>
    </div>
  )
}

export default function HistorialPage() {
  const [generations, setGenerations] = useState<GenerationWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationWithProduct | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/generations?limit=50')
      .then(r => r.json())
      .then(data => { setGenerations(data.generations || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? generations : generations.filter(g => g.tool === filter)

  if (selectedGeneration) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-10">
          <GenerationDetail generation={selectedGeneration} onBack={() => setSelectedGeneration(null)} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Historial</h1>
          <p className="text-white/40 text-sm mt-1">Todas tus generaciones — hacé clic para ver el contenido completo</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'ugc-anuncios', label: 'Anuncios' },
            { key: 'ugc-secuencias', label: 'Secuencias' },
            { key: 'ugc-catalogo', label: 'Catálogo' },
            { key: 'meta-ads', label: 'Meta Ads' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filter === f.key
                  ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                  : 'border-white/10 bg-white/5 text-white/40 hover:text-white/70'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-12 text-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-3"/>
            <p className="text-white/30 text-sm">Cargando historial...</p>
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-white/30 text-sm">
              {filter !== 'all' ? 'No hay generaciones de este tipo aún.' : 'No hay generaciones aún. ¡Empezá creando tu primera creatividad!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((g) => {
              const tool = toolLabels[g.tool] || { label: g.tool, color: 'tag-gray', icon: '✦' }
              const hasOutput = g.output && Object.keys(g.output).length > 0
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGeneration(g)}
                  className="w-full card p-4 flex items-center gap-4 card-hover rounded-xl text-left transition-all hover:border-violet-500/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center text-violet-400 text-sm flex-shrink-0">
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`tag ${tool.color} text-[10px]`}>{tool.label}</span>
                      {g.status === 'completed' && <span className="tag tag-green text-[10px]">Completado</span>}
                      {hasOutput && <span className="text-[10px] text-white/30">Ver contenido →</span>}
                    </div>
                    <p className="text-white/60 text-xs truncate">
                      {g.products?.name || 'Sin producto vinculado'}
                    </p>
                    {g.input && (g.input as Record<string, unknown>).nivel_conciencia && (
                      <p className="text-white/30 text-[10px] truncate mt-0.5">
                        {String((g.input as Record<string, unknown>).nivel_conciencia).slice(0, 50)}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white/30 text-xs">{new Date(g.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    <p className="text-white/20 text-[10px]">{new Date(g.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
