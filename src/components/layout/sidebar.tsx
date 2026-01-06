'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Profile } from '@/types/database'
import {
  LayoutDashboard,
  Target,
  CalendarCheck,
  Users,
  Settings,
  Trophy,
  LogOut,
  Network,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/metas', label: 'Metas', icon: Target },
  { href: '/dashboard/habitos', label: 'Hábitos', icon: CalendarCheck },
  { href: '/dashboard/conquistas', label: 'Conquistas', icon: Trophy },
]

const managerItems = [
  { href: '/dashboard/equipe', label: 'Minha Equipe', icon: Users },
  { href: '/dashboard/organograma', label: 'Organograma', icon: Network },
]

const adminItems = [
  { href: '/dashboard/admin', label: 'Administração', icon: ShieldCheck },
]

const bottomItems = [
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isManager = profile?.role === 'gestor' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#043F8D] text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 bg-[#F58300] rounded-lg flex items-center justify-center">
          <span className="text-white text-lg font-bold">PDI</span>
        </div>
        <div>
          <h1 className="font-bold text-lg">PDI Tracker</h1>
          <p className="text-xs text-white/60">ODuo Assessoria</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-[#F58300] text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}

        {isManager && (
          <>
            <div className="pt-4 pb-2 px-3">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Gestão
              </span>
            </div>
            {managerItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-[#F58300] text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </>
        )}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Admin
              </span>
            </div>
            {adminItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-[#F58300] text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-[#F58300] text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-white/80 hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>

      {/* User Info */}
      {profile && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{profile.name}</p>
              <p className="text-xs text-white/60 capitalize">{profile.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
