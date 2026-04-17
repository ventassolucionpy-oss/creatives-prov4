'use client'
import { useState, useEffect, useRef } from 'react'
import WizardStepper from '@/components/wizard/WizardStepper'
import ProductSelector from '@/components/wizard/ProductSelector'
import ProductModal from '@/components/wizard/ProductModal'
import ResultsPanel from '@/components/tools/ResultsPanel'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import type { Product, GenerationOutput } from '@/types'

export type FieldConfig = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'toggle' | 'currency' | 'multiselect'
  placeholder?: string
  options?: string[]
  required?: boolean
}

type Props = {
  tool: string
  title: string
  subtitle: string
  backHref: string
  steps: string[]
  fields: FieldConfig[]
  requiresProduct?: boolean
  andromedaData?: {
    selectedPostTypes?: string[]
    business?: string
    strategy?: string
  }
}

// ─────────────────────────────────────────────
// AUTO PÚBLICO FROM PRODUCT
// ─────────────────────────────────────────────
function generatePublicoFromProduct(product: Product): string {
  const desc = (product.description || '').toLowerCase()
  const cat = product.category

  if (cat === 'digital') {
    if (desc.match(/trading|inversión|finanzas|bolsa/)) return 'Hombres y mujeres 25-45, interesados en finanzas, inversión y libertad financiera, ingresos medios-altos, LATAM'
    if (desc.match(/fitness|ejercicio|gym|entrenamiento|musculación/)) return 'Hombres y mujeres 20-40, apasionados por el fitness y la vida saludable, que buscan mejorar su físico, clase media, LATAM'
    if (desc.match(/negocio|emprendimiento|marketing|ventas|ecommerce/)) return 'Emprendedores 22-45, dueños de pequeños negocios, interesados en crecer sus ventas digitalmente, LATAM'
    if (desc.match(/cocina|receta|alimentación|nutrición/)) return 'Mujeres 28-50, interesadas en alimentación saludable y cocina, amas de casa y profesionales, clase media, LATAM'
    return 'Personas 25-45 interesadas en aprendizaje online y crecimiento personal, que buscan resultados rápidos, clase media-alta, LATAM'
  }
  if (cat === 'fisico') {
    if (desc.match(/belleza|skin|crema|serum|facial|piel|cabello/)) return 'Mujeres 25-45, interesadas en skincare y cuidado personal, clase media-alta, Paraguay y LATAM'
    if (desc.match(/mascotas?|perro|gato|canino|felino/)) return 'Propietarios de mascotas 22-50, que tratan a sus mascotas como familia, ingresos medios, Paraguay'
    if (desc.match(/bebé|bebe|niño|infantil|mamá|maternidad/)) return 'Mamás y papás 25-40 con hijos de 0-8 años, que priorizan calidad y seguridad, clase media, Paraguay'
    if (desc.match(/fitness|deporte|gym|entrenamiento|suplemento/)) return 'Hombres y mujeres 18-40, activos físicamente, que buscan mejorar su rendimiento, clase media, Paraguay'
    if (desc.match(/cocina|hogar|casa|decoración|limpieza/)) return 'Mujeres y hombres 28-50 que valoran el hogar, compradores online frecuentes, clase media, Paraguay'
    if (desc.match(/tecnología|gadget|electrónico|celular|computadora/)) return 'Hombres 18-40, tech enthusiasts, early adopters, con poder adquisitivo medio-alto, Paraguay'
    return 'Compradores online 22-45 que buscan calidad-precio, reseñas positivas y envío rápido, clase media, Paraguay'
  }
  if (cat === 'servicio') {
    if (desc.match(/marketing|publicidad|redes|digital|ads/)) return 'Dueños de negocios y emprendedores 28-50 que quieren crecer digitalmente, con facturación activa, LATAM'
    if (desc.match(/legal|contable|finanzas|contabilidad/)) return 'Emprendedores y profesionales 30-55 con negocios establecidos que necesitan asesoría, Paraguay'
    return 'Empresarios y profesionales 28-50 que buscan soluciones eficientes para su negocio, clase media-alta, Paraguay y LATAM'
  }
  return `Personas 25-45 interesadas en ${product.name}, que buscan calidad y resultados comprobados, clase media, LATAM`
}

// ─────────────────────────────────────────────
// AWARENESS SUGGESTIONS
// ─────────────────────────────────────────────
type ConcienciaSug = { angulo: string[]; objetivo: string[]; tono: string[]; razon: string }

const NIVEL_SUGGESTIONS: Record<string, ConcienciaSug> = {
  '1': {
    angulo: ['Curiosidad / Dato disruptivo', 'Curiosidad / Disrupción'],
    objetivo: ['Branding/Awareness', 'Reconocimiento de marca', 'Tráfico web', 'Tráfico al sitio web'],
    tono: ['Cercano y natural (como un amigo)'],
    razon: 'Público muy frío — no saben que tienen el problema. Interrumpí con curiosidad o un dato disruptivo. Evitá vender directamente: el objetivo es generar conciencia, no conversión.',
  },
  '2': {
    angulo: ['Dolor / Frustración actual', 'Dolor / Frustración actual del público'],
    objetivo: ['Tráfico web', 'Tráfico al sitio web', 'Captar leads', 'Generación de leads'],
    tono: ['Empático / Comprensivo', 'Cercano y natural (como un amigo)'],
    razon: 'Sienten el dolor pero no buscan solución. Nombrá exactamente su frustración. El framework PAS (Problema → Agitación → Solución) convierte mejor aquí.',
  },
  '3': {
    angulo: ['Transformación / Resultado final', 'Resultado / Transformación específica'],
    objetivo: ['Generar ventas', 'Conversiones / Ventas', 'Captar leads', 'Generación de leads'],
    tono: ['Aspiracional / Inspirador', 'Urgente / Directo'],
    razon: 'El punto dulce de conversión. Ya buscan una solución — mostrá que la tuya es la mejor. AIDA o BAB son los frameworks que mejor convierten aquí.',
  },
  '4': {
    angulo: ['Miedo a perderse algo (FOMO)', 'Miedo a quedarse atrás (FOMO)', 'Prueba social / Lo que usan todos', 'Prueba social / Comunidad que ya lo usa'],
    objetivo: ['Generar ventas', 'Conversiones / Ventas', 'Retargeting — ya me conocen', 'Retargeting — ya visitaron mi tienda'],
    tono: ['Urgente / Directo', 'Exclusivo / Premium'],
    razon: 'Te conocen pero no compraron. Eliminá objeciones con testimonios y creá urgencia genuina. La prueba social y el FOMO convierten muy bien en este nivel.',
  },
  '5': {
    angulo: ['Miedo a perderse algo (FOMO)', 'Miedo a quedarse atrás (FOMO)', 'Exclusividad / Estatus', 'Exclusividad / Estatus / Premium'],
    objetivo: ['Retargeting — ya me conocen', 'Retargeting — ya visitaron mi tienda', 'Generar ventas', 'Conversiones / Ventas'],
    tono: ['Urgente / Directo'],
    razon: 'Listos para comprar. Sé 100% directo: oferta clara, urgencia real, sin historias. Solo el empujón final que necesitan para convertir.',
  },
}

function getNivelNum(val: string): string | null {
  if (val.includes('Nivel 1')) return '1'
  if (val.includes('Nivel 2')) return '2'
  if (val.includes('Nivel 3')) return '3'
  if (val.includes('Nivel 4')) return '4'
  if (val.includes('Nivel 5')) return '5'
  return null
}

function AwarenessBanner({
  nivel,
  fields,
  formData,
  onSet,
}: {
  nivel: string
  fields: FieldConfig[]
  formData: Record<string, string>
  onSet: (key: string, val: string) => void
}) {
  const num = getNivelNum(nivel)
  if (!num) return null
  const s = NIVEL_SUGGESTIONS[num]
  const hasAngulo = fields.some(f => f.key === 'angulo')
  const hasObjetivo = fields.some(f => f.key === 'objetivo')
  const hasTono = fields.some(f => f.key === 'tono')

  // Filter suggestions to only options that exist in the field's options
  const anguloField = fields.find(f => f.key === 'angulo')
  const objetivoField = fields.find(f => f.key === 'objetivo')
  const tonoField = fields.find(f => f.key === 'tono')

  const matchAngulo = s.angulo.filter(a => anguloField?.options?.some(o => o.startsWith(a.slice(0, 15))) || anguloField?.options?.includes(a))
  const matchObjetivo = s.objetivo.filter(o => objetivoField?.options?.some(opt => opt.startsWith(o.slice(0, 15))) || objetivoField?.options?.includes(o))
  const matchTono = s.tono.filter(t => tonoField?.options?.some(o => o.startsWith(t.slice(0, 15))) || tonoField?.options?.includes(t))

  // Use first matching option from the field options array
  const getOption = (field: FieldConfig | undefined, candidates: string[]) => {
    if (!field?.options) return candidates[0]
    for (const c of candidates) {
      const found = field.options.find(o => o.includes(c.slice(0, 12)))
      if (found) return found
    }
    return candidates[0]
  }

  return (
    <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/6 animate-fade-up">
      <p className="text-violet-300 text-xs font-bold mb-1">🧠 Sugerencias del experto — Nivel {num}</p>
      <p className="text-white/45 text-[11px] mb-3 leading-relaxed">{s.razon}</p>
      <div className="space-y-2.5">
        {hasAngulo && matchAngulo.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/25 text-[10px] w-16 flex-shrink-0">Ángulo:</span>
            {matchAngulo.slice(0, 2).map((a) => {
              const opt = getOption(anguloField, [a])
              return (
                <button key={a} onClick={() => onSet('angulo', opt)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    formData['angulo'] === opt
                      ? 'border-violet-400 bg-violet-500/25 text-violet-200'
                      : 'border-violet-500/35 bg-violet-500/8 text-violet-300 hover:bg-violet-500/18'
                  }`}>
                  {formData['angulo'] === opt ? '✓ ' : ''}{a.split('/')[0].trim()}
                </button>
              )
            })}
          </div>
        )}
        {hasObjetivo && matchObjetivo.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/25 text-[10px] w-16 flex-shrink-0">Objetivo:</span>
            {matchObjetivo.slice(0, 2).map((o) => {
              const opt = getOption(objetivoField, [o])
              return (
                <button key={o} onClick={() => onSet('objetivo', opt)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    formData['objetivo'] === opt
                      ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                      : 'border-emerald-500/35 bg-emerald-500/8 text-emerald-300 hover:bg-emerald-500/18'
                  }`}>
                  {formData['objetivo'] === opt ? '✓ ' : ''}{o.split('/')[0].split('—')[0].trim()}
                </button>
              )
            })}
          </div>
        )}
        {hasTono && matchTono.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/25 text-[10px] w-16 flex-shrink-0">Tono:</span>
            {matchTono.slice(0, 2).map((t) => {
              const opt = getOption(tonoField, [t])
              return (
                <button key={t} onClick={() => onSet('tono', opt)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    formData['tono'] === opt
                      ? 'border-amber-400 bg-amber-500/25 text-amber-200'
                      : 'border-amber-500/35 bg-amber-500/8 text-amber-300 hover:bg-amber-500/18'
                  }`}>
                  {formData['tono'] === opt ? '✓ ' : ''}{t.split('(')[0].trim()}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// BENEFICIOS MULTISELECT
// ─────────────────────────────────────────────
const BENEFICIOS_PRESET = [
  'Envío gratis', 'Pagás al recibir', 'Garantía incluida', 'Envío en 24hs',
  'Stock limitado', 'Precio especial hoy', 'Oferta por tiempo limitado',
  'Producto original', 'Últimas unidades', 'Cuotas sin interés',
  'Devolución garantizada', 'Atención por WhatsApp',
]

function BeneficiosMultiSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [custom, setCustom] = useState('')
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

  const toggle = (b: string) => {
    const next = selected.includes(b) ? selected.filter(s => s !== b) : [...selected, b]
    onChange(next.join(', '))
  }
  const addCustom = () => {
    if (!custom.trim() || selected.includes(custom.trim())) return
    onChange([...selected, custom.trim()].join(', '))
    setCustom('')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {BENEFICIOS_PRESET.map(b => (
          <button key={b} type="button" onClick={() => toggle(b)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              selected.includes(b)
                ? 'border-violet-500/60 bg-violet-500/20 text-violet-200 font-medium'
                : 'border-white/10 bg-white/3 text-white/40 hover:border-white/25 hover:text-white/70'
            }`}>
            {selected.includes(b) ? '✓ ' : ''}{b}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="input flex-1 text-sm" placeholder="Agregar beneficio personalizado..."
          value={custom} onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())} />
        <button type="button" onClick={addCustom}
          className="btn-secondary text-xs px-3 py-2 flex-shrink-0">+ Agregar</button>
      </div>
      {selected.length > 0 && (
        <p className="text-white/25 text-[10px]">Seleccionados: {selected.join(' · ')}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// CURRENCY FIELD
// ─────────────────────────────────────────────
const CURRENCIES = [
  { value: 'PYG', label: 'Guaraníes', symbol: 'Gs.', flag: '🇵🇾' },
  { value: 'USD', label: 'Dólares', symbol: '$', flag: '🇺🇸' },
]

function CurrencyField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [currency, setCurrency] = useState('PYG')
  const cur = CURRENCIES.find(c => c.value === currency) || CURRENCIES[0]

  const handleCurrencyChange = (newCur: string) => {
    setCurrency(newCur)
    const raw = value.replace(/^(Gs\.|[$])\s*/, '')
    const sym = newCur === 'PYG' ? 'Gs.' : '$'
    onChange(raw ? `${sym} ${raw}` : '')
  }

  const handleAmountChange = (amount: string) => onChange(amount ? `${cur.symbol} ${amount}` : '')
  const rawAmount = value.replace(/^(Gs\.|[$])\s*/, '')

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {CURRENCIES.map(c => (
          <button key={c.value} type="button" onClick={() => handleCurrencyChange(c.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              currency === c.value ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-white/10 bg-white/5 text-white/40 hover:text-white/70'
            }`}>
            <span>{c.flag}</span><span>{c.value}</span><span className="text-[10px] opacity-60">({c.symbol})</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 input px-3">
        <span className="text-white/40 text-sm font-mono flex-shrink-0">{cur.symbol}</span>
        <input className="flex-1 bg-transparent outline-none text-white text-sm"
          placeholder={currency === 'PYG' ? '150.000' : '29.99'}
          value={rawAmount} onChange={e => handleAmountChange(e.target.value)} />
        <span className="text-white/20 text-xs">{currency}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// IMAGE UPLOAD + AI ANALYSIS
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
      setPreview(dataUrl)
      setAnalyzing(true); setErr(''); setDone(false)
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
                { type: 'text', text: 'Analizá esta imagen de producto para publicidad. Respondé SOLO con JSON válido, sin backticks ni texto extra:\n{"nombre":"nombre del producto","descripcion":"descripción breve","categoria":"fisico|digital|servicio","beneficios":"beneficio1, beneficio2, beneficio3","publico":"público objetivo con demografía LATAM","angulo_sugerido":"ángulo de venta más efectivo","prompt_creativo":"idea de creativo publicitario"}' }
              ]
            }]
          })
        })
        if (!res.ok) throw new Error('API error')
        const d = await res.json()
        const text = d.content?.map((c: {type:string;text?:string}) => c.text||'').join('')
        const parsed = JSON.parse(text.replace(/```json|```/g,'').trim())
        setDone(true)
        onAnalyzed(parsed)
      } catch {
        setErr('No se pudo analizar. Completá los campos manualmente.')
      }
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
          <p className="text-white/20 text-[10px] mt-0.5">La IA analizará y pre-completará los campos del formulario</p>
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
// FIELD SUGGESTIONS (non-awareness)
// ─────────────────────────────────────────────
type SugData = { title: string; reason: string; items: string[] }
const FIELD_SUBS: Record<string, Record<string, SugData>> = {
  angulo: {
    'IA elige el más efectivo para este producto': { title: '💡 Modo Automático', reason: 'La IA elegirá el ángulo con mayor potencial para este producto y nivel de conciencia.', items: ['✅ Recomendado si no tenés datos previos', '✅ Genera variantes para A/B testing real'] },
    'IA elige el más efectivo': { title: '💡 Modo Automático', reason: 'La IA elegirá el ángulo con mayor potencial para este producto y nivel de conciencia.', items: ['✅ Recomendado sin datos históricos previos', '✅ Genera variantes para A/B testing real'] },
  },
  objetivo: {
    'Generar ventas': { title: '💡 Conversiones directas', reason: 'Necesitás CTA muy claro, precio visible y razón para actuar HOY.', items: ['✅ Nivel ideal: 3-5', '✅ Audiencias cálidas'] },
    'Conversiones / Ventas': { title: '💡 Conversiones directas', reason: 'Necesitás CTA muy claro, precio visible y razón para actuar HOY.', items: ['✅ Nivel ideal: 3-5', '✅ Audiencias cálidas'] },
    'Retargeting — ya me conocen': { title: '💡 Retargeting', reason: 'Ya te conocen. Sé directo, eliminá objeciones y cerrá con oferta irresistible.', items: ['✅ Nivel ideal: 5', '✅ Ángulo: FOMO o Prueba Social'] },
    'Retargeting — ya visitaron mi tienda': { title: '💡 Retargeting', reason: 'Ya te conocen. Sé directo, eliminá objeciones y cerrá con oferta irresistible.', items: ['✅ Nivel ideal: 5', '✅ Ángulo: FOMO o Prueba Social'] },
  },
}

function FieldSug({ fkey, value }: { fkey: string; value: string }) {
  const s = FIELD_SUBS[fkey]?.[value]
  if (!s) return null
  return (
    <div className="mt-2 p-3 rounded-xl border border-violet-500/25 bg-violet-500/5 animate-fade-up">
      <p className="text-violet-300 text-xs font-semibold mb-1">{s.title}</p>
      <p className="text-white/45 text-[11px] mb-1.5">{s.reason}</p>
      {s.items.map((item, i) => <p key={i} className="text-white/55 text-[11px]">{item}</p>)}
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function WizardPage({
  tool, title, subtitle, backHref, steps, fields, requiresProduct = true, andromedaData
}: Props) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [output, setOutput] = useState<GenerationOutput | null>(null)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const totalSteps = steps.length

  const setField = (key: string, val: string) => setFormData(p => ({ ...p, [key]: val }))

  // Auto-fill público when product selected
  useEffect(() => {
    if (selectedProduct && fields.some(f => f.key === 'publico')) {
      setFormData(p => ({ ...p, publico: generatePublicoFromProduct(selectedProduct) }))
    }
  }, [selectedProduct?.id])

  // Pre-fill from Andromeda
  useEffect(() => {
    if (andromedaData?.selectedPostTypes?.length) {
      setFormData(p => ({
        ...p,
        andromeda_tipos: andromedaData.selectedPostTypes!.join(','),
        andromeda_business: andromedaData.business || '',
        andromeda_strategy: andromedaData.strategy || '',
      }))
    }
  }, [])

  const handleImageAnalyzed = (data: Record<string, string>) => {
    setFormData(p => ({
      ...p,
      ...(data.beneficios && !p.beneficios ? { beneficios: data.beneficios } : {}),
      ...(data.publico && !p.publico ? { publico: data.publico } : {}),
      _image_analysis: JSON.stringify(data),
    }))
  }

  const handleGenerate = async () => {
    setIsGenerating(true); setError(''); setOutput(null); setImageUrl(undefined)
    try {
      const payload = {
        tool,
        product_id: selectedProduct?.id,
        producto: selectedProduct?.name || formData.producto || '',
        descripcion: selectedProduct?.description || formData.descripcion || '',
        categoria: selectedProduct?.category || 'fisico',
        ...formData,
        ...(andromedaData ? {
          andromeda_tipos: andromedaData.selectedPostTypes?.join(','),
          andromeda_business: andromedaData.business,
          andromeda_strategy: andromedaData.strategy,
        } : {}),
      }
      const res = await fetch('/api/generations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const data = await res.json()
      setOutput(data)
      setCurrentStep(totalSteps)
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
      setError(err instanceof Error ? err.message : 'Error'); setIsGenerating(false)
    }
  }

  const canProceed = () => {
    if (currentStep === 1 && requiresProduct) return !!selectedProduct
    if (currentStep === 2) return fields.filter(f => f.required).every(f => formData[f.key]?.trim())
    return true
  }

  const inputClass = 'input'
  const labelClass = 'block text-xs font-medium text-white/40 mb-1.5'
  const nivelVal = formData['nivel_conciencia'] || ''

  return (
    <div className="min-h-screen">
      <Navbar />
      {showProductModal && (
        <ProductModal
          onClose={() => setShowProductModal(false)}
          onCreated={(p) => { setSelectedProduct(p); setShowProductModal(false) }}
        />
      )}

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href={backHref} className="btn-ghost text-white/30 hover:text-white p-1.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">{title}</h1>
            <p className="text-white/40 text-xs">{subtitle}</p>
          </div>
        </div>

        <WizardStepper steps={steps} currentStep={currentStep} />

        {/* Andromeda context banner */}
        {andromedaData?.selectedPostTypes?.length ? (
          <div className="mb-4 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
            <p className="text-violet-300 text-xs font-semibold mb-1.5">✦ Generando desde Andromeda — {andromedaData.strategy}</p>
            <div className="flex flex-wrap gap-1.5">
              {andromedaData.selectedPostTypes.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 bg-violet-500/15 border border-violet-500/20 rounded-full text-violet-300">{t}</span>
              ))}
            </div>
          </div>
        ) : null}

        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-up">
            <ProductImageUpload onAnalyzed={handleImageAnalyzed} />

            {requiresProduct ? (
              <ProductSelector
                selectedProductId={selectedProduct?.id || null}
                onSelect={(p) => setSelectedProduct(p)}
                onCreateNew={() => setShowProductModal(true)}
              />
            ) : (
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-white text-sm">Información del producto</h3>
                <div>
                  <label className={labelClass}>Nombre del producto *</label>
                  <input className={inputClass} value={formData.producto || ''} onChange={e => setField('producto', e.target.value)} placeholder="Nombre del producto o servicio" />
                </div>
                <div>
                  <label className={labelClass}>Descripción *</label>
                  <textarea className={`${inputClass} resize-none h-20`} value={formData.descripcion || ''} onChange={e => setField('descripcion', e.target.value)} placeholder="Describí el producto en detalle..." />
                </div>
              </div>
            )}

            {selectedProduct && (
              <div className="card p-4 border border-violet-500/20 bg-violet-500/5">
                <p className="text-xs text-violet-400 font-semibold mb-1">Plantilla automática</p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p className="text-white/50 text-xs">IA elige la plantilla más adecuada para <strong className="text-white">{selectedProduct.name}</strong></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="card p-5 space-y-5 animate-fade-up">
            <h3 className="font-semibold text-white text-sm mb-1">Configuración</h3>

            {/* Show awareness banner right after nivel_conciencia is selected */}
            {nivelVal && (
              <AwarenessBanner
                nivel={nivelVal}
                fields={fields}
                formData={formData}
                onSet={setField}
              />
            )}

            {fields.map(field => (
              <div key={field.key}>
                <label className={labelClass}>
                  {field.label}{field.required ? ' *' : ''}
                  {field.key === 'publico' && selectedProduct && (
                    <span className="ml-2 text-violet-400/60 text-[10px] font-normal">✦ Auto-completado desde el producto</span>
                  )}
                  {(field.key === 'angulo' || field.key === 'objetivo' || field.key === 'tono') && nivelVal && (
                    <span className="ml-2 text-violet-400/50 text-[10px] font-normal">↑ Ver sugerencias arriba</span>
                  )}
                </label>

                {field.type === 'currency' ? (
                  <CurrencyField value={formData[field.key] || ''} onChange={v => setField(field.key, v)} />
                ) : field.type === 'multiselect' ? (
                  <BeneficiosMultiSelect value={formData[field.key] || ''} onChange={v => setField(field.key, v)} />
                ) : field.type === 'textarea' ? (
                  <textarea className={`${inputClass} resize-none h-20`} value={formData[field.key] || ''}
                    onChange={e => setField(field.key, e.target.value)} placeholder={field.placeholder} />
                ) : field.type === 'select' ? (
                  <>
                    <select
                      className={`${inputClass} cursor-pointer ${
                        (field.key === 'angulo' || field.key === 'objetivo' || field.key === 'tono') && formData[field.key] && nivelVal
                          ? 'border-violet-500/40' : ''
                      }`}
                      value={formData[field.key] || ''}
                      onChange={e => setField(field.key, e.target.value)}>
                      <option value="" style={{ background: '#111' }}>Seleccionar...</option>
                      {field.options?.map(opt => <option key={opt} value={opt} style={{ background: '#111' }}>{opt}</option>)}
                    </select>
                    {formData[field.key] && field.key !== 'nivel_conciencia' && (
                      <FieldSug fkey={field.key} value={formData[field.key]} />
                    )}
                  </>
                ) : (
                  <input className={`${inputClass} ${field.key === 'publico' && selectedProduct ? 'border-violet-500/25' : ''}`}
                    value={formData[field.key] || ''}
                    onChange={e => setField(field.key, e.target.value)}
                    placeholder={field.placeholder} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: Generate */}
        {currentStep === 3 && !output && (
          <div className="card p-8 text-center animate-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center text-3xl mx-auto mb-4">✦</div>
            <h3 className="text-white font-semibold text-lg mb-2">Listo para generar</h3>
            <p className="text-white/40 text-sm mb-6">La IA generará tu paquete creativo completo en segundos</p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {selectedProduct && <span className="tag tag-violet text-xs">{selectedProduct.name}</span>}
              {formData['nivel_conciencia'] && <span className="tag tag-gray text-xs">{formData['nivel_conciencia'].split('—')[0].trim()}</span>}
              {formData['angulo'] && <span className="tag tag-gray text-xs">{(formData['angulo'] || '').slice(0, 28)}{(formData['angulo'] || '').length > 28 ? '…' : ''}</span>}
              {formData['objetivo'] && <span className="tag tag-gray text-xs">{formData['objetivo']}</span>}
              {andromedaData?.selectedPostTypes?.length && (
                <span className="tag tag-violet text-xs">{andromedaData.selectedPostTypes.length} tipos de creatividad</span>
              )}
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary px-8 py-3">
              {isGenerating
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2"/>Generando con IA...</>
                : '✦ Generar creatividades'}
            </button>
          </div>
        )}

        {/* STEP FINAL: Results */}
        {currentStep === totalSteps && output && (
          <div className="animate-fade-up">
            <ResultsPanel output={output} tool={tool} imageUrl={imageUrl} isLoadingImage={isLoadingImage} />
          </div>
        )}

        {/* Navigation */}
        {currentStep < totalSteps && !(currentStep === totalSteps - 1 && isGenerating) && (
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <button onClick={() => setCurrentStep(s => s - 1)} className="btn-secondary flex-1">← Anterior</button>
            )}
            {currentStep < totalSteps - 1 ? (
              <button onClick={() => setCurrentStep(s => s + 1)} disabled={!canProceed()} className="btn-primary flex-1">Siguiente →</button>
            ) : currentStep === totalSteps - 1 ? (
              <button onClick={() => setCurrentStep(s => s + 1)} disabled={!canProceed()} className="btn-primary flex-1">Continuar →</button>
            ) : null}
          </div>
        )}

        {/* New generation */}
        {currentStep === totalSteps && output && (
          <div className="mt-6 flex gap-3">
            <button onClick={() => { setOutput(null); setCurrentStep(1); setSelectedProduct(null); setFormData({}) }} className="btn-secondary flex-1">
              ← Nueva generación
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
