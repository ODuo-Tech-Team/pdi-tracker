'use client'

import { useState } from 'react'
import { Profile, UserRole } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { User, Shield, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ConfiguracoesFormProps {
  profile: Profile | null
  allUsers: Array<{ id: string; name: string; email: string; role: string }>
}

export function ConfiguracoesForm({ profile, allUsers }: ConfiguracoesFormProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('colaborador')
  const [selectedManager, setSelectedManager] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const isAdmin = profile?.role === 'admin'

  const handleUpdateName = async () => {
    if (!name.trim()) {
      toast.error('Nome não pode ser vazio')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', profile!.id)

    if (error) {
      toast.error('Erro ao atualizar nome')
      setLoading(false)
      return
    }

    toast.success('Nome atualizado!')
    router.refresh()
    setLoading(false)
  }

  const handleUpdateUserRole = async () => {
    if (!selectedUser) {
      toast.error('Selecione um usuário')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        role: selectedRole,
        manager_id: selectedManager || null,
      })
      .eq('id', selectedUser)

    if (error) {
      toast.error('Erro ao atualizar usuário')
      setLoading(false)
      return
    }

    toast.success('Usuário atualizado!')
    router.refresh()
    setLoading(false)
  }

  const managers = allUsers.filter(u => u.role === 'gestor' || u.role === 'admin')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#043F8D]/10 rounded-lg">
              <User className="h-5 w-5 text-[#043F8D]" />
            </div>
            <div>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Suas informações pessoais</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
              <Button
                onClick={handleUpdateName}
                disabled={loading || name === profile?.name}
                className="bg-[#F58300] hover:bg-[#e07600]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email || ''} disabled />
            <p className="text-xs text-gray-500">O email não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <Label>Função</Label>
            <Input value={profile?.role || ''} disabled className="capitalize" />
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Conta</CardTitle>
              <CardDescription>Informações da sua conta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Membro desde</p>
              <p className="text-sm text-gray-500">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('pt-BR')
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Section */}
      {isAdmin && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Administração</CardTitle>
                <CardDescription>Gerenciar usuários e permissões</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecionar Usuário</Label>
              <Select value={selectedUser || '_none_'} onValueChange={(v) => setSelectedUser(v === '_none_' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Selecione um usuario...</SelectItem>
                  {allUsers
                    .filter(u => u.id !== profile?.id)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUser && (
              <>
                <Separator />

                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colaborador">Colaborador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedRole === 'colaborador' && (
                  <div className="space-y-2">
                    <Label>Gestor</Label>
                    <Select
                      value={selectedManager || 'none'}
                      onValueChange={(v) => setSelectedManager(v === 'none' ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gestor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem gestor</SelectItem>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleUpdateUserRole}
                  disabled={loading}
                  className="w-full bg-[#F58300] hover:bg-[#e07600]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Atualizar Usuário
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
