'use client'
import { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase'

type Generation = {
  id: string
  tool: string
  created_at: string
  output?: Record<string, unknown>
  products?: { name: string }
}

export default function ExportarPage() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [selected, setSelected] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('generations')
        .select('id, tool, created_at, output, products(name)')
        .order('created_at', { ascending: false })
        .limit(30)
      setGenerations((data || []) as Generation[])
      setLoading(false)
    }
    load()
  }, [])

  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 200)
  }

  const toolLabels: Record<string, string> = {
    'ugc-anuncios': 'UGC Anuncios', 'ugc-secuencias': 'UGC Secuencias',
    'ugc-catalogo': 'UGC Catálogo', 'meta-ads': 'Meta Ads',
    'tiktok': 'TikTok', 'hotmart': 'Hotmart',
  }

  const output = selected?.output as Record<string, unknown> | undefined
  const copies = output?.copies as Array<Record<string, unknown>> | undefined
  const audiencias = output?.perfilesAudiencia as Array<Record<string, unknown>> | undefined
  const checklist = output?.checklistLanzamiento as Record<string, Array<{ item: string; critico: boolean }>> | undefined
  const metricas = output?.analisisMetricas as Record<string, unknown> | undefined
  const estructura = output?.estructuraCampana as Record<string, unknown> | undefined
  const calendario = output?.calendarioRotacion as Record<string, unknown> | undefined

  return (
    <div className="min-h-screen">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { background: white !important; color: black !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print">
        <Navbar />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Selector — solo visible en pantalla */}
        <div className="no-print mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">📄 Exportar a PDF</h1>
              <p className="text-white/40 text-xs mt-0.5">Generá un PDF listo para leer mientras configurás en Meta Ads Manager</p>
            </div>
            {selected && (
              <button onClick={handlePrint} disabled={printing} className="btn-primary px-5 py-2.5 text-sm">
                {printing ? 'Preparando...' : '⬇ Descargar PDF'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="card p-8 text-center"><div className="w-6 h-6 border-2 border-white/20 border-t-violet-500 rounded-full animate-spin mx-auto"/></div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-white/30 mb-3">Elegí una generación para exportar:</p>
              {generations.map(g => (
                <button key={g.id} onClick={() => setSelected(g)}
                  className={`w-full p-4 card rounded-xl text-left transition-all ${selected?.id === g.id ? 'border-violet-500 bg-violet-500/10' : 'card-hover'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-semibold">{(g as Generation & { products?: { name: string } }).products?.name || 'Sin producto'}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-white/40 text-xs">{toolLabels[g.tool] || g.tool}</span>
                        <span className="text-white/20 text-xs">{new Date(g.created_at).toLocaleDateString('es-PY')}</span>
                      </div>
                    </div>
                    {selected?.id === g.id && <span className="text-violet-400 text-sm">✓ Seleccionada</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTENIDO PARA IMPRIMIR */}
        {selected && output && (
          <div ref={printRef} className="print-page">
            {/* Header del PDF */}
            <div className="no-print mb-6 mt-4 p-4 card border border-violet-500/20 bg-violet-500/5 rounded-xl">
              <p className="text-violet-300 text-xs font-semibold">Vista previa del PDF — lo que se va a imprimir:</p>
            </div>

            <div className="bg-white rounded-xl p-8 text-black space-y-8">
              {/* Título */}
              <div className="border-b-2 border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{(selected as Generation & { products?: { name: string } }).products?.name || 'Sin producto'}</h1>
                    <p className="text-gray-500 text-sm mt-1">{toolLabels[selected.tool] || selected.tool} · {new Date(selected.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Generado con</p>
                    <p className="font-bold text-gray-700">Creatives Pro</p>
                  </div>
                </div>
              </div>

              {/* COPIES */}
              {copies && copies.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">1</span>
                    Copies para A/B testing ({copies.length} variantes)
                  </h2>
                  <div className="space-y-4">
                    {copies.map((c, i) => (
                      <div key={i} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded">Copy {String(c.id)}</span>
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{String(c.framework || '')}</span>
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{String(c.angulo || '')}</span>
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">Nivel {String(c.nivel_conciencia || '')}</span>
                        </div>
                        <p className="font-bold text-gray-800 text-sm mb-2">🎯 Hook: "{String(c.hook || '')}"</p>
                        <p className="font-semibold text-gray-700 text-sm mb-2">Titular: {String(c.titular || '')}</p>
                        <p className="text-gray-600 text-sm leading-relaxed mb-2 whitespace-pre-line">{String(c.cuerpo || '')}</p>
                        <p className="text-purple-700 font-semibold text-sm">CTA: {String(c.cta || '')}</p>
                        <p className="text-gray-400 text-xs mt-2 italic">💡 {String(c.por_que_funciona || '')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AUDIENCIAS */}
              {audiencias && audiencias.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">2</span>
                    Perfiles de audiencia ({audiencias.length} segmentos)
                  </h2>
                  <div className="space-y-3">
                    {audiencias.map((a, i) => (
                      <div key={i} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-800">{String(a.nombre || '')}</span>
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded capitalize">{String(a.temperatura || '').replace('_', ' ')}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{String(a.descripcion || '')}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div><span className="font-semibold">Edad:</span> {String((a.demografia as Record<string,string>)?.edad || '')}</div>
                          <div><span className="font-semibold">Presupuesto:</span> {String(a.presupuesto_sugerido || '')}</div>
                          <div className="col-span-2"><span className="font-semibold">Intereses:</span> {(a.intereses as string[])?.join(', ')}</div>
                          <div className="col-span-2"><span className="font-semibold">Copy recomendado:</span> {String(a.copy_recomendado || '')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ESTRUCTURA CAMPAÑA */}
              {estructura && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center font-bold">3</span>
                    Estructura de campaña
                  </h2>
                  <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
                    <p><span className="font-semibold">Tipo:</span> {String(estructura.tipo || '')}</p>
                    <p><span className="font-semibold">Objetivo Meta:</span> {String(estructura.objetivo_meta || '')}</p>
                    <p><span className="font-semibold">Presupuesto total/día:</span> {String(estructura.presupuesto_total_diario || '')}</p>
                    <p className="text-gray-500 text-xs">{String(estructura.razon || '')}</p>
                    <div className="mt-3 space-y-2">
                      {(estructura.ad_sets as Array<Record<string,unknown>> || []).map((as_, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-semibold text-sm">{String(as_.nombre || '')}</p>
                          <p className="text-xs text-gray-500">Presupuesto: {String(as_.presupuesto_diario || '')} · Copies: {(as_.copies_asignados as number[] || []).join(', ')}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 pt-3 space-y-1 text-xs text-gray-600">
                      <p><span className="font-semibold text-green-700">↑ Escalar cuando:</span> {String(estructura.cuando_escalar || '')}</p>
                      <p><span className="font-semibold text-red-700">✕ Matar cuando:</span> {String(estructura.cuando_matar || '')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* CHECKLIST */}
              {checklist && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs flex items-center justify-center font-bold">4</span>
                    Checklist de lanzamiento
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(checklist).map(([section, items]) => {
                      const labels: Record<string,string> = { pixel: 'Pixel & Tracking', cuenta: 'Cuenta', creatividades: 'Creatividades', pagina_destino: 'Página de destino', estrategia: 'Estrategia' }
                      return (
                        <div key={section} className="border border-gray-200 rounded-xl p-3">
                          <p className="font-semibold text-gray-700 text-sm mb-2">{labels[section] || section}</p>
                          <div className="space-y-1.5">
                            {items.map((item, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 ${item.critico ? 'border-red-400' : 'border-gray-300'}`}/>
                                <p className={`text-xs ${item.critico ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{item.item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* MÉTRICAS */}
              {metricas && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs flex items-center justify-center font-bold">5</span>
                    Referencia de métricas
                  </h2>
                  <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-xs text-gray-600">
                    <p><span className="font-semibold text-green-700">Escalar:</span> {String(metricas.cuando_escalar || '')}</p>
                    <p><span className="font-semibold text-red-700">Matar:</span> {String(metricas.cuando_matar || '')}</p>
                    <p><span className="font-semibold">Tiempo para decidir:</span> {String(metricas.dias_para_decidir || '')}</p>
                  </div>
                </div>
              )}

              {/* CALENDARIO */}
              {calendario && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold">6</span>
                    Plan de 4 semanas
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {(['semana_1','semana_2','semana_3','semana_4'] as const).map((sem, i) => {
                      const s = calendario[sem] as Record<string,unknown> | undefined
                      if (!s) return null
                      return (
                        <div key={sem} className="border border-gray-200 rounded-xl p-3">
                          <p className="font-bold text-gray-800 text-sm mb-1">Semana {i+1}</p>
                          <p className="text-gray-500 text-xs mb-2">{String(s.objetivo || '')}</p>
                          {(s.acciones as string[] || []).map((a, ai) => <p key={ai} className="text-xs text-gray-600">• {a}</p>)}
                          <p className="text-xs text-gray-400 mt-2 italic">{String(s.decision_al_final || '')}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 text-center">
                <p className="text-gray-400 text-xs">Generado con Creatives Pro · {new Date().toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
