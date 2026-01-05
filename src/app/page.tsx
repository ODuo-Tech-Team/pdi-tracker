import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Target, CalendarCheck, Trophy, Users, ArrowRight } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#043F8D] to-[#0A5BC4]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F58300] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">PDI</span>
            </div>
            <span className="text-white font-bold text-xl">PDI Tracker</span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Entrar
            </Button>
          </Link>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Acompanhe seu{' '}
            <span className="text-[#F58300]">Plano de Desenvolvimento</span>{' '}
            Individual
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Cadastre metas, registre hábitos diários e visualize seu progresso
            através de dashboards intuitivos. Gamificação com streaks e conquistas
            para manter você engajado.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/registro">
              <Button size="lg" className="bg-[#F58300] hover:bg-[#e07600] text-white">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mt-24">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-[#F58300] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Metas</h3>
            <p className="text-white/60 text-sm">
              Defina e acompanhe suas metas profissionais e pessoais
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-[#F58300] rounded-xl flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Hábitos</h3>
            <p className="text-white/60 text-sm">
              Registre hábitos diários e construa consistência
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-[#F58300] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Conquistas</h3>
            <p className="text-white/60 text-sm">
              Desbloqueie badges e mantenha sua motivação
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-[#F58300] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Equipe</h3>
            <p className="text-white/60 text-sm">
              Gestores acompanham o progresso da equipe
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-24 text-white/40 text-sm">
          <p>ODuo Assessoria © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}
