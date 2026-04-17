'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type AdResult = {
  id: string
  generation_id: string
  copy_id: number
  framework: string
  angulo: string
  hook: string
  nivel_conciencia: number
  // Métricas cargadas
  impresiones: number
  clicks: number
  conversiones: number
  gasto: number
  ingresos: number
  // Calculadas
  ctr: number
  cpc: number
  cpa: number
  roas: number
  estado: 'en_prueba' | 'ganadora' | 'perdedora' | 'pausada'
  notas: string
  fecha: string
  producto_nombre: string
}

type Generation = {
  id: string
  tool: string
  created_at: string
  products?: { name: string }
  output?: { copies?: Array<{ id: number; framework: string; angulo: string; hook: string; nivel_conciencia: number }> }
}

function MetricBadge({ value, type }: { value: number | null; type: 'roas' | 'ctr' | 'cpc' | 'cpa' }) {
  if (value === null || value === 0) return <span className="text-white/20 text-xs">—</span>
  
  const configs = {
    roas: { good: 2, great: 4, suffix: 'x', prefix: '' },
    ctr: { good: 1, great: 3, suffix: '%', prefix: '' },
    cpc: { good: 0.8, great: 0.3, suffix: '', prefix: '$', invert: true },
    cpa: { good: 20, great: 10, suffix: '', prefix: '$', invert: true },
  }
  const cfg = configs[type]
  const isInvert = 'invert' in cfg && cfg.invert
  const isGood = isInvert ? value <= cfg.good : value >= cfg.good
  const isGreat = isInvert ? value <= cfg.great : value >= cfg.great
  const color = isGreat ? 'text-emerald-400' : isGood ? 'text-amber-400' : 'text-red-400'
  
  return (
    <span className={`text-xs font-bold ${color}`}>
      {cfg.prefix}{type === 'ctr' ? (value * 100).toFixed(2) : value.toFixed(2)}{cfg.suffix}
    </span>
  )
}

export default function TrackerPage() {
  const [results, setResults] = useState<AdResult[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null)
  const [selectedCopyId, setSelectedCopyId] = useState<number | null>(null)
  const [form, setForm] = useState({ impresiones: '', clicks: '', conversiones: '', gasto: '', ingresos: '', notas: '', estado: 'en_prueba' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    // Cargar resultados guardados
    const { data: res } = await supabase
      .from('ad_results')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(50)
    
    // Cargar generaciones recientes para vincular
    const { data: gens } = await supabase
      .from('generations')
      .select('id, tool, created_at, output, products(name)')
      .in('tool', ['ugc-anuncios', 'meta-ads'])
      .order('created_at', { ascending: false })
      .limit(20)
    
    setResults(res || [])
    setGenerations((gens || []) as Generation[])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!selectedGen || selectedCopyId === null) return
    setSaving(true)
    
    const copy = selectedGen.output?.copies?.find(c => c.id === selectedCopyId)
    const imp = parseInt(form.impresiones) || 0
    const clicks = parseInt(form.clicks) || 0
    const conv = parseInt(form.conversiones) || 0
    const gasto = parseFloat(form.gasto) || 0
    const ingresos = parseFloat(form.ingresos) || 0
    
    const record = {
      generation_id: selectedGen.id,
      copy_id: selectedCopyId,
      framework: copy?.framework || '',
      angulo: copy?.angulo || '',
      hook: copy?.hook || '',
      nivel_conciencia: copy?.nivel_conciencia || 0,
      impresiones: imp,
      clicks,
      conversiones: conv,
      gasto,
      ingresos,
      ctr: imp > 0 ? clicks / imp : 0,
      cpc: clicks > 0 ? gasto / clicks : 0,
      cpa: conv > 0 ? gasto / conv : 0,
      roas: gasto > 0 ? ingresos / gasto : 0,
      estado: form.estado,
      notas: form.notas,
      fecha: new Date().toISOString(),
      producto_nombre: (selectedGen as Generation & { products?: { name: string } }).products?.name || '',
    }
    
    await supabase.from('ad_results').insert(record)
    setSaving(false)
    setShowForm(false)
    setForm({ impresiones: '', clicks: '', conversiones: '', gasto: '', ingresos: '', notas: '', estado: 'en_prueba' })
    setSelectedGen(null)
    setSelectedCopyId(null)
    loadData()
  }

  // Stats agregadas
  const totalGasto = results.reduce((a, r) => a + (r.gasto || 0), 0)
  const totalIngresos = results.reduce((a, r) => a + (r.ingresos || 0), 0)
  const totalConv = results.reduce((a, r) => a + (r.conversiones || 0), 0)
  const roasGlobal = totalGasto > 0 ? totalIngresos / totalGasto : 0
  const ganadoras = results.filter(r => r.estado === 'ganadora').length

  // Framework más efectivo
  const byFramework: Record<string, { roas: number[]; wins: number }> = {}
  results.forEach(r => {
    if (!r.framework) return
    if (!byFramework[r.framework]) byFramework[r.framework] = { roas: [], wins: 0 }
    if (r.roas > 0) byFramework[r.framework].roas.push(r.roas)
    if (r.estado === 'ganadora') byFramework[r.framework].wins++
  })
  const bestFramework = Object.entries(byFramework)
    .map(([fw, data]) => ({ fw, avgRoas: data.roas.length ? data.roas.reduce((a,b)=>a+b,0)/data.roas.length : 0, wins: data.wins }))
    .sort((a,b) => b.avgRoas - a.avgRoas)[0]

  const estadoColors: Record<string, string> = {
    en_prueba: 'text-white/50',
    ganadora: 'text-emerald-400',
    perdedora: 'text-red-400',
    pausada: 'text-amber-400',
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">📊 Tracker de resultados</h1>
            <p className="text-white/40 text-xs mt-0.5">Cargá los resultados reales de tus ads para aprender qué funciona</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2">
            + Cargar resultado
          </button>
        </div>

        {/* Stats globales */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="card p-4">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Performance global</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-white/30 text-[10px]">ROAS global</p><p className={`text-lg font-bold ${roasGlobal >= 2 ? 'text-emerald-400' : roasGlobal >= 1 ? 'text-amber-400' : 'text-red-400'}`}>{roasGlobal.toFixed(2)}x</p></div>
                <div><p className="text-white/30 text-[10px]">Gasto total</p><p className="text-white font-bold">${totalGasto.toFixed(0)}</p></div>
                <div><p className="text-white/30 text-[10px]">Ingresos</p><p className="text-emerald-400 font-bold">${totalIngresos.toFixed(0)}</p></div>
                <div><p className="text-white/30 text-[10px]">Conversiones</p><p className="text-white font-bold">{totalConv}</p></div>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Aprendizaje IA</p>
              {bestFramework ? (
                <div>
                  <p className="text-[10px] text-white/40 mb-1">Framework más efectivo para vos:</p>
                  <p className="text-violet-300 font-bold text-sm">{bestFramework.fw}</p>
                  <p className="text-white/40 text-[11px]">ROAS promedio: {bestFramework.avgRoas.toFixed(2)}x · {bestFramework.wins} victorias</p>
                </div>
              ) : (
                <p className="text-white/20 text-xs">Cargá al menos 3 resultados para ver insights</p>
              )}
              <div className="mt-3 pt-3 border-t border-white/8">
                <p className="text-white/30 text-[10px]">Ads ganadores: <span className="text-emerald-400 font-bold">{ganadoras}</span> de {results.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Insight de ángulos */}
        {results.length >= 3 && (() => {
          const byAngulo: Record<string, { roas: number[] }> = {}
          results.forEach(r => {
            if (!r.angulo || r.roas <= 0) return
            if (!byAngulo[r.angulo]) byAngulo[r.angulo] = { roas: [] }
            byAngulo[r.angulo].roas.push(r.roas)
          })
          const sorted = Object.entries(byAngulo)
            .map(([a, d]) => ({ angulo: a, avg: d.roas.reduce((x,y)=>x+y,0)/d.roas.length }))
            .sort((a,b) => b.avg - a.avg)
          if (sorted.length === 0) return null
          return (
            <div className="card p-4 border border-violet-500/20 bg-violet-500/5 mb-6">
              <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider mb-2">🧠 Insight personalizado</p>
              <p className="text-white text-sm font-semibold">Tu ángulo más rentable: <span className="text-violet-300">{sorted[0].angulo}</span></p>
              <p className="text-white/50 text-xs mt-1">ROAS promedio {sorted[0].avg.toFixed(2)}x. La próxima vez que generés anuncios, priorizá este ángulo.</p>
              {sorted.length > 1 && <p className="text-white/30 text-[11px] mt-1">Segundo mejor: {sorted[1].angulo} ({sorted[1].avg.toFixed(2)}x)</p>}
            </div>
          )
        })()}

        {/* Lista de resultados */}
        {loading ? (
          <div className="card p-12 text-center"><div className="w-6 h-6 border-2 border-white/20 border-t-violet-500 rounded-full animate-spin mx-auto"/></div>
        ) : results.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-white/50 text-sm font-semibold mb-1">Sin resultados todavía</p>
            <p className="text-white/30 text-xs mb-4">Cuando lances un ad, volvé acá y cargá los resultados reales. La app aprende qué funciona para tus productos.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2">+ Cargar primer resultado</button>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-xs font-semibold">{r.producto_nombre || 'Sin producto'}</span>
                      <span className={`text-[10px] font-medium ${estadoColors[r.estado]}`}>{r.estado.replace('_', ' ')}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {r.framework && <span className="tag tag-gray text-[10px]">{r.framework}</span>}
                      {r.angulo && <span className="tag tag-gray text-[10px]">{r.angulo}</span>}
                    </div>
                  </div>
                  <p className="text-white/20 text-[10px]">{new Date(r.fecha).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' })}</p>
                </div>
                {r.hook && <p className="text-white/50 text-xs italic mb-2">"{r.hook}"</p>}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center"><p className="text-[10px] text-white/25">ROAS</p><MetricBadge value={r.roas} type="roas" /></div>
                  <div className="text-center"><p className="text-[10px] text-white/25">CTR</p><MetricBadge value={r.ctr} type="ctr" /></div>
                  <div className="text-center"><p className="text-[10px] text-white/25">CPC</p><MetricBadge value={r.cpc} type="cpc" /></div>
                  <div className="text-center"><p className="text-[10px] text-white/25">CPA</p><MetricBadge value={r.cpa} type="cpa" /></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5 text-center text-[10px]">
                  <div><p className="text-white/25">Gasto</p><p className="text-white/60">${r.gasto}</p></div>
                  <div><p className="text-white/25">Ingresos</p><p className="text-emerald-400/80">${r.ingresos}</p></div>
                  <div><p className="text-white/25">Conversiones</p><p className="text-white/60">{r.conversiones}</p></div>
                </div>
                {r.notas && <p className="text-white/30 text-[11px] mt-2 pt-2 border-t border-white/5">{r.notas}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Modal para cargar resultado */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold">Cargar resultado de ad</h2>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white text-xl">×</button>
              </div>

              {/* Paso 1: elegir generación */}
              <div className="mb-4">
                <label className="block text-xs text-white/40 mb-1.5">¿De qué generación?</label>
                <select className="input cursor-pointer" value={selectedGen?.id || ''} onChange={e => {
                  const gen = generations.find(g => g.id === e.target.value)
                  setSelectedGen(gen || null)
                  setSelectedCopyId(null)
                }} style={{ background: '#111' }}>
                  <option value="">Seleccionar generación...</option>
                  {generations.map(g => (
                    <option key={g.id} value={g.id} style={{ background: '#111' }}>
                      {(g as Generation & { products?: { name: string } }).products?.name || 'Sin producto'} — {new Date(g.created_at).toLocaleDateString('es-PY')} ({g.tool})
                    </option>
                  ))}
                </select>
              </div>

              {/* Paso 2: elegir copy */}
              {selectedGen?.output?.copies && (
                <div className="mb-4">
                  <label className="block text-xs text-white/40 mb-1.5">¿Qué copy/variante lanzaste?</label>
                  <div className="space-y-2">
                    {selectedGen.output.copies.map(c => (
                      <button key={c.id} onClick={() => setSelectedCopyId(c.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${selectedCopyId === c.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/3 hover:border-white/20'}`}>
                        <div className="flex gap-2 mb-1">
                          <span className="tag tag-gray text-[10px]">{c.framework}</span>
                          <span className="text-white/40 text-[10px]">{c.angulo}</span>
                        </div>
                        <p className="text-white/70 text-xs italic">"{c.hook}"</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Métricas */}
              {selectedCopyId !== null && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'impresiones', label: 'Impresiones', placeholder: '10000' },
                      { key: 'clicks', label: 'Clicks', placeholder: '150' },
                      { key: 'conversiones', label: 'Conversiones', placeholder: '5' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs text-white/40 mb-1">{f.label}</label>
                        <input className="input" type="number" placeholder={f.placeholder}
                          value={form[f.key as keyof typeof form]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Gasto (USD)</label>
                      <input className="input" type="number" step="0.01" placeholder="25.00"
                        value={form.gasto} onChange={e => setForm(p => ({ ...p, gasto: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Ingresos generados (USD)</label>
                    <input className="input" type="number" step="0.01" placeholder="80.00"
                      value={form.ingresos} onChange={e => setForm(p => ({ ...p, ingresos: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Estado del ad</label>
                    <select className="input cursor-pointer" value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} style={{ background: '#111' }}>
                      <option value="en_prueba" style={{ background: '#111' }}>En prueba</option>
                      <option value="ganadora" style={{ background: '#111' }}>Ganadora ✅</option>
                      <option value="perdedora" style={{ background: '#111' }}>Perdedora ❌</option>
                      <option value="pausada" style={{ background: '#111' }}>Pausada ⏸</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Notas (opcional)</label>
                    <textarea className="input resize-none h-16 text-xs" placeholder="Ej: Funcionó bien con mujeres 25-35, pausa a los 5 días por fatiga..."
                      value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
                  </div>
                  <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
                    {saving ? 'Guardando...' : '💾 Guardar resultado'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
