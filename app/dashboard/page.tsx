import { createServerComponentClient } from '@/lib/supabase-server'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'

const TOOLS = [
  {
    id: 'ugc', href: '/creativos/ugc', available: true,
    icon: '✦', color: 'bg-violet-600',
    title: 'Creativos UGC',
    desc: 'Anuncios, secuencias y catálogo con copies, audiencias y prompts visuales.',
    subtags: ['Anuncios', 'Secuencias', 'Catálogo'],
  },
  {
    id: 'meta', href: '/creativos/meta-ads', available: true,
    icon: '⊞', color: 'bg-blue-600',
    title: 'Meta Ads',
    desc: 'Estrategia completa con segmentación, copies y creatividades.',
    subtags: ['Segmentación', 'Copies', 'Creatividades'],
  },
  {
    id: 'tiktok', href: '/creativos/tiktok', available: true,
    icon: '◈', color: 'bg-pink-600',
    title: 'TikTok',
    desc: 'Scripts de video viral, guiones UGC y estrategia para TikTok.',
    subtags: ['Scripts virales', 'TikTok Shop', 'Hashtags'],
  },
  {
    id: 'hotmart', href: '/creativos/hotmart', available: true,
    icon: '◉', color: 'bg-orange-500',
    title: 'Hotmart / Digital',
    desc: 'Funnel completo: página de ventas, emails y WhatsApp scripts.',
    subtags: ['Página de ventas', 'Email', 'WhatsApp'],
  },
]

export default async function DashboardPage() {
  const supabase = await createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user?.id).single()
  const { data: recentGens } = await supabase
    .from('generations')
    .select('id, tool, created_at, products(name)')
    .order('created_at', { ascending: false })
    .limit(5)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, category')
    .eq('user_id', user?.id || '')
    .limit(3)
  const { count: totalGens } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })

  const userName = profile?.name || user?.email?.split('@')[0] || 'Usuario'
  const toolLabels: Record<string, { label: string; color: string }> = {
    'ugc-anuncios': { label: 'UGC Anuncios', color: 'text-violet-400' },
    'ugc-secuencias': { label: 'UGC Secuencias', color: 'text-blue-400' },
    'ugc-catalogo': { label: 'UGC Catálogo', color: 'text-emerald-400' },
    'meta-ads': { label: 'Meta Ads', color: 'text-blue-400' },
    'tiktok': { label: 'TikTok', color: 'text-pink-400' },
    'hotmart': { label: 'Hotmart', color: 'text-orange-400' },
  }

  // Hora del día para el saludo
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="min-h-screen">
      <Navbar userName={userName} />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Welcome */}
        <div className="mb-8 animate-fade-up">
          <p className="text-white/30 text-sm mb-1">{greeting},</p>
          <h1 className="text-3xl font-bold text-white mb-1">
            <span className="text-violet-400">{userName}</span> 👋
          </h1>
          <p className="text-white/40 text-sm">Tu centro de operaciones para Meta Ads.</p>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Generaciones totales', value: totalGens || 0, icon: '◎', color: 'text-violet-400' },
            { label: 'Productos activos', value: products?.length || 0, icon: '◫', color: 'text-amber-400' },
            { label: 'Herramientas', value: 4, icon: '⊕', color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={i} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-white/30 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Accesos rápidos por producto */}
        {products && products.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-3">Tus productos</p>
            <div className="grid grid-cols-1 gap-2">
              {products.map((p) => (
                <div key={p.id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 text-sm flex-shrink-0">◫</div>
                    <div>
                      <p className="text-white text-sm font-semibold">{p.name}</p>
                      <p className="text-white/30 text-[10px] capitalize">{p.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/creativos/ugc/anuncios`} className="px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 text-[11px] font-medium hover:bg-violet-500/25 transition-colors">
                      Anuncio
                    </Link>
                    <Link href={`/tracker`} className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-[11px] font-medium hover:bg-white/10 transition-colors">
                      Tracker
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-3">Acciones rápidas</p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/creativos/ugc/anuncios" className="card p-4 flex items-center gap-3 card-hover rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 text-sm flex-shrink-0">✦</div>
              <div>
                <p className="text-white text-xs font-semibold">Nuevo anuncio</p>
                <p className="text-white/30 text-[10px]">UGC con IA</p>
              </div>
            </Link>
            <Link href="/tracker" className="card p-4 flex items-center gap-3 card-hover rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 flex items-center justify-center text-emerald-400 text-sm flex-shrink-0">📊</div>
              <div>
                <p className="text-white text-xs font-semibold">Tracker de métricas</p>
                <p className="text-white/30 text-[10px]">Cargar resultados</p>
              </div>
            </Link>
            <Link href="/biblioteca" className="card p-4 flex items-center gap-3 card-hover rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-amber-600/20 flex items-center justify-center text-amber-400 text-sm flex-shrink-0">🗂</div>
              <div>
                <p className="text-white text-xs font-semibold">Biblioteca</p>
                <p className="text-white/30 text-[10px]">Prompts guardados</p>
              </div>
            </Link>
            <Link href="/historial" className="card p-4 flex items-center gap-3 card-hover rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm flex-shrink-0">🕐</div>
              <div>
                <p className="text-white text-xs font-semibold">Historial</p>
                <p className="text-white/30 text-[10px]">Ver generaciones</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Herramientas */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-3">Herramientas</p>
          <div className="space-y-2">
            {TOOLS.map((tool, i) => (
              <Link key={tool.id} href={tool.href}
                className="flex items-center gap-4 p-4 card card-hover rounded-xl cursor-pointer animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s` }}>
                <div className={`w-10 h-10 rounded-xl ${tool.color} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm mb-0.5">{tool.title}</p>
                  <p className="text-white/40 text-xs mb-1.5">{tool.desc}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {tool.subtags.map(tag => <span key={tag} className="tag tag-gray text-[10px]">{tag}</span>)}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white/20 flex-shrink-0">
                  <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Recientes */}
        {recentGens && recentGens.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-white/25 uppercase tracking-widest">Recientes</p>
              <Link href="/historial" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Ver todo →</Link>
            </div>
            <div className="space-y-2">
              {(recentGens as Array<{ id: string; tool: string; created_at: string; products?: { name: string } }>).map((g) => {
                const tl = toolLabels[g.tool] || { label: g.tool, color: 'text-white/40' }
                return (
                  <Link key={g.id} href={`/historial`} className="flex items-center gap-3 p-3 card rounded-lg card-hover">
                    <div className="w-7 h-7 rounded-lg bg-violet-600/15 flex items-center justify-center text-violet-400 text-xs flex-shrink-0">✦</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${tl.color}`}>{tl.label}</p>
                      {g.products?.name && <p className="text-white/30 text-[10px] truncate">{g.products.name}</p>}
                    </div>
                    <p className="text-white/20 text-[10px] flex-shrink-0">{new Date(g.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' })}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
