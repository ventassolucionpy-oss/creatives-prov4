'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ProductSelector from '@/components/wizard/ProductSelector'
import ProductModal from '@/components/wizard/ProductModal'
import ResultsPanel from '@/components/tools/ResultsPanel'
import WizardStepper from '@/components/wizard/WizardStepper'
import Link from 'next/link'
import type { Product, GenerationOutput } from '@/types'

// ─────────────────────────────────────────────
// POST TYPE NAMES MAP
// ─────────────────────────────────────────────
const POST_TYPE_NAMES: Record<string, string> = {
  'imagen-estatica': '🖼️ Imagen Estática',
  'carrusel': '🎴 Carrusel',
  'antes-despues': '↔️ Antes & Después',
  'video-ugc': '📱 Video UGC',
  'problema-solucion': '🎯 Problema → Solución',
  'testimonial': '⭐ Testimonial Real',
  'unboxing': '📦 Unboxing / Reveal',
  'comparativa': '⚖️ Comparativa / vs.',
  'lifestyle': '✨ Lifestyle',
  'demo-producto': '🛠️ Demo / How-to',
  'hook-curiosidad': '🤔 Hook de Curiosidad',
  'urgencia-escasez': '⏰ Urgencia / Escasez',
  'tutorial-educativo': '📚 Tutorial / Educativo',
  'resultado-especifico': '📈 Resultado Específico',
  'objecion-directa': '🛡️ Rebate de Objeción',
}

// ─────────────────────────────────────────────
// AUTO PÚBLICO FROM PRODUCT
// ─────────────────────────────────────────────
function generatePublicoFromProduct(product: Product): string {
  const desc = (product.description || '').toLowerCase()
  const cat = product.category
  if (cat === 'digital') {
    if (desc.match(/trading|inversión|finanzas/)) return 'Hombres y mujeres 25-45, interesados en finanzas e inversión, ingresos medios-altos, LATAM'
    if (desc.match(/fitness|ejercicio|gym/)) return 'Hombres y mujeres 20-40, apasionados por el fitness, que buscan mejorar su físico, clase media, LATAM'
    if (desc.match(/negocio|emprendimiento|marketing|ventas/)) return 'Emprendedores 22-45, dueños de pequeños negocios, interesados en crecer sus ventas digitalmente, LATAM'
    return 'Personas 25-45 interesadas en aprendizaje online y crecimiento personal, clase media-alta, LATAM'
  }
  if (cat === 'fisico') {
    if (desc.match(/belleza|skin|crema|facial|piel/)) return 'Mujeres 25-45, interesadas en skincare y cuidado personal, clase media-alta, Paraguay y LATAM'
    if (desc.match(/mascotas?|perro|gato/)) return 'Propietarios de mascotas 22-50, que tratan a sus mascotas como familia, ingresos medios, Paraguay'
    if (desc.match(/bebé|bebe|niño|infantil/)) return 'Mamás y papás 25-40 con hijos de 0-8 años, que priorizan calidad, clase media, Paraguay'
    if (desc.match(/tecnología|gadget|electrónico/)) return 'Hombres 18-40, tech enthusiasts, early adopters, poder adquisitivo medio-alto, Paraguay'
    return 'Compradores online 22-45 que buscan calidad-precio y envío rápido, clase media, Paraguay'
  }
  return `Personas 25-45 interesadas en ${product.name}, que buscan resultados comprobados, clase media, LATAM`
}

// ─────────────────────────────────────────────
// IMAGE UPLOAD
// ─────────────────────────────────────────────
function ProductImageUpload({ onAnalyzed }: { onAnalyzed: (data: Record<string, string>) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const analyze = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(',')[1]
      setPreview(dataUrl); setAnalyzing(true); setErr(''); setDone(false)
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: file.type as 'image/jpeg'|'image/png'|'image/webp', data: base64 } },
                { type: 'text', text: 'Analizá esta imagen de producto para publicidad Meta Ads. SOLO JSON sin backticks:\n{"nombre":"nombre del producto","descripcion":"descripción breve","categoria":"fisico|digital|servicio","beneficios":"beneficio1, beneficio2, beneficio3","publico":"público objetivo con demografía LATAM","angulo_sugerido":"ángulo de venta más efectivo"}' }
              ]
            }]
          })
        })
        if (!res.ok) throw new Error('API error')
        const d = await res.json()
        const text = d.content?.map((c: {type:string;text?:string}) => c.text||'').join('')
        const parsed = JSON.parse(text.replace(/```json|```/g,'').trim())
        setDone(true); onAnalyzed(parsed)
      } catch { setErr('No se pudo analizar. Completá los campos manualmente.') }
      setAnalyzing(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="card p-4 border border-violet-500/15 bg-violet-500/3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-violet-400 text-xs font-bold">📸 Imagen del producto</span>
        <span className="text-white/20 text-[10px]">— la IA captura los datos automáticamente</span>
      </div>
      {!preview ? (
        <div className="border-2 border-dashed border-white/10 rounded-xl p-5 text-center cursor-pointer hover:border-violet-500/30 transition-all"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) analyze(f) }}>
          <div className="text-2xl mb-1.5">🖼️</div>
          <p className="text-white/35 text-xs">Arrastrá o hacé click para subir</p>
          <p className="text-white/20 text-[10px] mt-0.5">La IA pre-completará los campos automáticamente</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) analyze(f) }} />
        </div>
      ) : (
        <div className="flex gap-3 items-center">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
            <img src={preview} alt="producto" className="w-full h-full object-cover" />
            <button onClick={() => { setPreview(null); setDone(false); setErr('') }}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[9px] flex items-center justify-center hover:bg-red-500/80">✕</button>
          </div>
          <div>
            {analyzing && <div className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"/><p className="text-violet-300 text-xs">Analizando con IA...</p></div>}
            {done && <p className="text-emerald-400 text-xs font-medium">✓ Campos pre-completados desde la imagen</p>}
            {err && <p className="text-red-400 text-xs">{err}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE (inner — needs useSearchParams)
// ─────────────────────────────────────────────
function AndromeaGenerarInner() {
  const searchParams = useSearchParams()
  const tiposParam = searchParams.get('tipos') || ''
  const strategyId = searchParams.get('strategy') || ''
  const strategyName = searchParams.get('strategyName') ? decodeURIComponent(searchParams.get('strategyName')!) : ''
  const business = searchParams.get('business') || 'dropshipping'

  const tiposIds = tiposParam ? tiposParam.split(',').filter(Boolean) : []

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [output, setOutput] = useState<GenerationOutput | null>(null)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [error, setError] = useState('')
  const [extraConfig, setExtraConfig] = useState<Record<string, string>>({})

  const steps = ['Producto', 'Configurar', 'Generando', 'Resultados']
  const totalSteps = steps.length

  // Auto-fill público when product selected
  useEffect(() => {
    if (selectedProduct) {
      setExtraConfig(p => ({
        ...p,
        publico: p.publico || generatePublicoFromProduct(selectedProduct),
      }))
    }
  }, [selectedProduct?.id])

  const handleImageAnalyzed = (data: Record<string, string>) => {
    setExtraConfig(p => ({
      ...p,
      ...(data.publico && !p.publico ? { publico: data.publico } : {}),
      ...(data.beneficios && !p.beneficios ? { beneficios: data.beneficios } : {}),
      _image_analysis: JSON.stringify(data),
    }))
  }

  const handleGenerate = async () => {
    if (!selectedProduct) return
    setIsGenerating(true); setError(''); setOutput(null); setImageUrl(undefined)
    setCurrentStep(3)

    try {
      const payload = {
        tool: 'andromeda-meta-ads',
        product_id: selectedProduct.id,
        producto: selectedProduct.name,
        descripcion: selectedProduct.description,
        categoria: selectedProduct.category,
        andromeda_tipos: tiposIds.join(','),
        andromeda_business: business,
        andromeda_strategy: strategyId,
        andromeda_strategy_name: strategyName,
        ...extraConfig,
      }

      const res = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const data = await res.json()
      setOutput(data)
      setCurrentStep(4)
      setIsGenerating(false)

      if (data.dallePrompt) {
        setIsLoadingImage(true)
        try {
          const imgRes = await fetch('/api/generate-image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: data.dallePrompt }),
          })
          if (imgRes.ok) { const img = await imgRes.json(); setImageUrl(img.imageUrl) }
        } catch { /* optional */ }
        setIsLoadingImage(false)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setIsGenerating(false)
      setCurrentStep(2)
    }
  }

  const inputClass = 'input'
  const labelClass = 'block text-xs font-medium text-white/40 mb-1.5'

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/creativos/andromeda" className="btn-ghost text-white/30 hover:text-white p-1.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">Andromeda</h1>
              <span className="tag tag-violet text-[10px]">Generación Automática</span>
            </div>
            <p className="text-white/40 text-xs">{strategyName || 'Generar todos los tipos de creatividad de la estrategia'}</p>
          </div>
        </div>

        <WizardStepper steps={steps} currentStep={currentStep} />

        {/* Context banner */}
        {tiposIds.length > 0 && (
          <div className="mb-5 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
            <p className="text-violet-300 text-xs font-bold mb-2">✦ {tiposIds.length} tipos de creatividad a generar</p>
            <div className="flex flex-wrap gap-1.5">
              {tiposIds.map(id => (
                <span key={id} className="text-[11px] px-2.5 py-1 bg-violet-500/12 border border-violet-500/25 rounded-full text-violet-300">
                  {POST_TYPE_NAMES[id] || id}
                </span>
              ))}
            </div>
            <p className="text-white/25 text-[10px] mt-2">La IA generará copies y prompts específicos para cada uno de estos formatos</p>
          </div>
        )}

        {/* STEP 1: Producto */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-up">
            <ProductImageUpload onAnalyzed={handleImageAnalyzed} />
            <ProductSelector
              selectedProductId={selectedProduct?.id || null}
              onSelect={(p) => setSelectedProduct(p)}
              onCreateNew={() => setShowProductModal(true)}
            />
            {selectedProduct && (
              <div className="card p-4 border border-violet-500/20 bg-violet-500/5">
                <p className="text-xs text-violet-400 font-semibold mb-1">Producto seleccionado</p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p className="text-white/50 text-xs">La IA generará creatividades para <strong className="text-white">{selectedProduct.name}</strong></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Configuración rápida */}
        {currentStep === 2 && (
          <div className="card p-5 space-y-5 animate-fade-up">
            <div>
              <p className="text-white font-semibold text-sm mb-1">Configuración</p>
              <p className="text-white/30 text-xs">El público objetivo ya fue auto-completado desde tu producto. Podés ajustarlo si querés.</p>
            </div>

            <div>
              <label className={labelClass}>
                Público objetivo
                {selectedProduct && <span className="ml-2 text-violet-400/60 text-[10px] font-normal">✦ Auto-completado desde el producto</span>}
              </label>
              <input className={`${inputClass} ${selectedProduct ? 'border-violet-500/25' : ''}`}
                value={extraConfig.publico || ''}
                onChange={e => setExtraConfig(p => ({ ...p, publico: e.target.value }))}
                placeholder="Público objetivo (auto-completado desde el producto)" />
            </div>

            <div>
              <label className={labelClass}>Nivel de conciencia del público</label>
              <select className={inputClass}
                value={extraConfig.nivel_conciencia || ''}
                onChange={e => setExtraConfig(p => ({ ...p, nivel_conciencia: e.target.value }))}>
                <option value="" style={{ background: '#111' }}>Seleccionar... (opcional)</option>
                <option value="Nivel 1" style={{ background: '#111' }}>Nivel 1 — No sabe que tiene el problema (frío)</option>
                <option value="Nivel 2" style={{ background: '#111' }}>Nivel 2 — Sabe que sufre, no busca solución</option>
                <option value="Nivel 3" style={{ background: '#111' }}>Nivel 3 — Busca solución, no te conoce (tibio)</option>
                <option value="Nivel 4" style={{ background: '#111' }}>Nivel 4 — Te conoce, falta el empujón (caliente)</option>
                <option value="Nivel 5" style={{ background: '#111' }}>Nivel 5 — Listo para comprar / retargeting</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Presupuesto diario</label>
              <select className={inputClass}
                value={extraConfig.presupuesto || ''}
                onChange={e => setExtraConfig(p => ({ ...p, presupuesto: e.target.value }))}>
                <option value="" style={{ background: '#111' }}>Seleccionar... (opcional)</option>
                <option value="USD 5-10 (test)" style={{ background: '#111' }}>USD 5-10 / día (test inicial)</option>
                <option value="USD 10-30 (intermedio)" style={{ background: '#111' }}>USD 10-30 / día (intermedio)</option>
                <option value="USD 30-100 (escala)" style={{ background: '#111' }}>USD 30-100 / día (escalado)</option>
                <option value="USD 100+ (dominio)" style={{ background: '#111' }}>USD 100+ / día (dominio)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>País/Región</label>
              <select className={inputClass}
                value={extraConfig.pais || ''}
                onChange={e => setExtraConfig(p => ({ ...p, pais: e.target.value }))}>
                <option value="" style={{ background: '#111' }}>Seleccionar...</option>
                <option value="Paraguay" style={{ background: '#111' }}>Paraguay</option>
                <option value="Argentina" style={{ background: '#111' }}>Argentina</option>
                <option value="Uruguay" style={{ background: '#111' }}>Uruguay</option>
                <option value="Chile" style={{ background: '#111' }}>Chile</option>
                <option value="Colombia" style={{ background: '#111' }}>Colombia</option>
                <option value="México" style={{ background: '#111' }}>México</option>
                <option value="LATAM completo" style={{ background: '#111' }}>LATAM completo</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: Generating */}
        {currentStep === 3 && isGenerating && (
          <div className="card p-10 text-center animate-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center mx-auto mb-5">
              <span className="w-7 h-7 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin block" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Generando {tiposIds.length} formatos...</h3>
            <p className="text-white/35 text-sm mb-5">La IA está creando copies y prompts para cada tipo de creatividad de la estrategia</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {tiposIds.map((id, i) => (
                <span key={id} className="text-[11px] px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300/70 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
                  {POST_TYPE_NAMES[id] || id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — generate CTA (pre-generate) */}
        {currentStep === 2 && !isGenerating && (
          <div className="mt-4 card p-6 text-center">
            <p className="text-white/40 text-sm mb-4">Todo listo para generar los {tiposIds.length} tipos de creatividad</p>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary px-8 py-3">
              ✦ Generar todas las creatividades →
            </button>
          </div>
        )}

        {/* STEP 4: Results */}
        {currentStep === 4 && output && (
          <div className="animate-fade-up">
            <ResultsPanel output={output} tool="andromeda-meta-ads" imageUrl={imageUrl} isLoadingImage={isLoadingImage} />
          </div>
        )}

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <button onClick={() => setCurrentStep(s => s - 1)} className="btn-secondary flex-1">← Anterior</button>
            )}
            {currentStep === 1 && (
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedProduct}
                className="btn-primary flex-1">
                Siguiente →
              </button>
            )}
          </div>
        )}

        {/* New generation */}
        {currentStep === 4 && output && (
          <div className="mt-6 flex gap-3">
            <Link href="/creativos/andromeda" className="btn-secondary flex-1 text-center">
              ← Volver a Andromeda
            </Link>
            <button onClick={() => { setOutput(null); setCurrentStep(1); setSelectedProduct(null); setExtraConfig({}) }} className="btn-ghost flex-1 text-white/40 hover:text-white">
              Nueva generación
            </button>
          </div>
        )}

      </main>

      {showProductModal && (
        <ProductModal
          onClose={() => setShowProductModal(false)}
          onCreated={(p) => { setSelectedProduct(p); setShowProductModal(false) }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// EXPORT (wrapped in Suspense for useSearchParams)
// ─────────────────────────────────────────────
export default function AndromeaGenerarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    }>
      <AndromeaGenerarInner />
    </Suspense>
  )
}
