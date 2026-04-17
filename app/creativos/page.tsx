import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase-server'

const TOOLS = [
  { href: '/creativos/ugc', icon: '✦', color: 'bg-violet-600', title: 'Creativos UGC', desc: 'Anuncios, secuencias y catálogo de producto con IA', sub: ['Anuncios', 'Secuencias', 'Catálogo'] },
  { href: '/creativos/meta-ads', icon: '⊞', color: 'bg-blue-600', title: 'Meta Ads', desc: 'Estrategia completa Facebook e Instagram', sub: ['Segmentación', 'Copies', 'Presupuesto'] },
  { href: '/creativos/tiktok', icon: '◈', color: 'bg-pink-600', title: 'TikTok / TikTok Shop', desc: 'Scripts virales y contenido para TikTok', sub: ['Scripts', 'TikTok Shop', 'Hashtags'] },
  { href: '/creativos/hotmart', icon: '◉', color: 'bg-orange-500', title: 'Hotmart / Digitales', desc: 'Funnel completo para productos digitales', sub: ['Página de ventas', 'Emails', 'WhatsApp'] },
]

const STRATEGY_TOOL = {
  href: '/creativos/andromeda',
  icon: '✺',
  color: 'bg-gradient-to-br from-violet-600 to-indigo-600',
  title: 'Andromeda — Escala Meta Ads',
  desc: 'Guía progresiva para escalar y convertir más. 3 fases, KPIs, tipos de post y estrategias para Dropshipping y Hotmart.',
  sub: ['Dropshipping', 'Hotmart', 'Fases de escala', '15 formatos'],
  badge: 'Nuevo',
}

export default async function CreativosPage() {
  const supabase = await createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user?.id).single()

  return (
    <div className="min-h-screen">
      <Navbar userName={profile?.name} />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Creativos</h1>
          <p className="text-white/40 text-sm mt-1">Seleccioná la herramienta para tu campaña</p>
        </div>

        {/* Andromeda destacado */}
        <Link href={STRATEGY_TOOL.href}
          className="tool-card animate-fade-up mb-4 border-violet-500/30 bg-violet-500/5 hover:border-violet-500/50 relative overflow-hidden"
          style={{ animationDelay: '0s' }}>
          <div className="absolute top-3 right-3">
            <span className="tag tag-violet text-[10px]">{STRATEGY_TOOL.badge}</span>
          </div>
          <div className={`w-12 h-12 rounded-xl ${STRATEGY_TOOL.color} flex items-center justify-center text-white text-xl`}>
            {STRATEGY_TOOL.icon}
          </div>
          <div>
            <h2 className="text-white font-semibold mb-1">{STRATEGY_TOOL.title}</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-2">{STRATEGY_TOOL.desc}</p>
            <div className="flex gap-1.5 flex-wrap">
              {STRATEGY_TOOL.sub.map(s => <span key={s} className="tag tag-violet text-[10px]">{s}</span>)}
            </div>
          </div>
          <div className="mt-auto"><span className="text-violet-400 text-sm font-medium">→ Ver estrategia</span></div>
        </Link>

        {/* Herramientas estándar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map((tool, i) => (
            <Link key={i} href={tool.href}
              className="tool-card animate-fade-up" style={{ animationDelay: `${(i+1)*0.08}s` }}>
              <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center text-white text-xl`}>{tool.icon}</div>
              <div>
                <h2 className="text-white font-semibold mb-1">{tool.title}</h2>
                <p className="text-white/40 text-sm leading-relaxed mb-2">{tool.desc}</p>
                <div className="flex gap-1.5 flex-wrap">{tool.sub.map(s => <span key={s} className="tag tag-gray text-[10px]">{s}</span>)}</div>
              </div>
              <div className="mt-auto"><span className="text-violet-400 text-sm font-medium">→ Comenzar</span></div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
