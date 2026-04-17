'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Props = { userName?: string }

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/creativos', label: 'Creativos' },
  { href: '/tracker', label: '📊 Tracker' },
  { href: '/biblioteca', label: '🗂 Biblioteca' },
  { href: '/exportar', label: '📄 PDF' },
  { href: '/historial', label: 'Historial' },
]

export default function Navbar({ userName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <header className="border-b border-white/5 px-6 h-14 flex items-center justify-between sticky top-0 z-50"
      style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-tight">Creatives Pro</span>
        </Link>
        <nav className="flex items-center gap-0.5">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'text-white bg-white/8' : 'text-white/40 hover:text-white/70 hover:bg-white/4'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/perfil"
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-xs font-semibold text-violet-300">
            {initials}
          </div>
          <span className="text-sm text-white/50 hidden sm:block">{userName || 'Usuario'}</span>
        </Link>
        <button onClick={handleLogout}
          className="text-xs text-white/25 hover:text-white/50 transition-colors px-2 py-1">
          Salir
        </button>
      </div>
    </header>
  )
}
