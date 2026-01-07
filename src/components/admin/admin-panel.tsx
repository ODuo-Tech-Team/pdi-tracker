'use client'

import { useState } from 'react'
import { Profile, UserRole, ROLE_LABELS } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Pencil,
  UserX,
  UserCheck,
  Users,
  UserPlus,
  Building2,
  Shield,
  ChevronRight,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminPanelProps {
  users: Profile[]
  managers: Profile[]
  currentUserId: string
  stats: {
    total_users: number
    total_admins: number
    total_gestores: number
    total_colaboradores: number
    active_users: number
    inactive_users: number
    total_goals: number
    completed_goals: number
    total_habits: number
  }
}

export function AdminPanel({ users: initialUsers, managers, currentUserId, stats }: AdminPanelProps) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedManagerForTeam, setSelectedManagerForTeam] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                          user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Get team members for a manager
  const getTeamMembers = (managerId: string) => {
    return users.filter(u => u.manager_id === managerId)
  }

  // Create user
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const role = formData.get('role') as UserRole
    const managerId = formData.get('manager_id') as string
    const department = formData.get('department') as string
    const position = formData.get('position') as string
    const password = formData.get('password') as string

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (authError) {
      toast.error(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role,
          manager_id: managerId && managerId !== 'none' ? managerId : null,
          department: department || null,
          position: position || null,
        })
        .eq('id', authData.user.id)

      if (updateError) {
        toast.error('Erro ao atualizar perfil')
      } else {
        toast.success('Usuario criado com sucesso!')
        setIsCreateOpen(false)
        router.refresh()
      }
    }

    setLoading(false)
  }

  // Update user
  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUser) return
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const role = formData.get('role') as UserRole
    const managerId = formData.get('manager_id') as string
    const department = formData.get('department') as string
    const position = formData.get('position') as string

    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        role,
        manager_id: managerId && managerId !== 'none' ? managerId : null,
        department: department || null,
        position: position || null,
      })
      .eq('id', editingUser.id)

    if (error) {
      toast.error('Erro ao atualizar usuario')
    } else {
      toast.success('Usuario atualizado!')
      setUsers(users.map(u =>
        u.id === editingUser.id
          ? { ...u, name, role, manager_id: managerId && managerId !== 'none' ? managerId : null, department, position }
          : u
      ))
      setIsEditOpen(false)
      setEditingUser(null)
    }

    setLoading(false)
  }

  // Toggle user active status
  const handleToggleActive = async (user: Profile) => {
    const newStatus = user.is_active === false ? true : false

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: newStatus })
      .eq('id', user.id)

    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      toast.success(newStatus ? 'Usuario reativado!' : 'Usuario desativado!')
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, is_active: newStatus } : u
      ))
    }
  }

  // Add member to team
  const handleAddToTeam = async (userId: string, managerId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ manager_id: managerId })
      .eq('id', userId)

    if (error) {
      toast.error('Erro ao adicionar membro')
    } else {
      toast.success('Membro adicionado a equipe!')
      setUsers(users.map(u =>
        u.id === userId ? { ...u, manager_id: managerId } : u
      ))
    }
  }

  // Remove member from team
  const handleRemoveFromTeam = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ manager_id: null })
      .eq('id', userId)

    if (error) {
      toast.error('Erro ao remover membro')
    } else {
      toast.success('Membro removido da equipe!')
      setUsers(users.map(u =>
        u.id === userId ? { ...u, manager_id: null } : u
      ))
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200'
      case 'gestor': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return '-'
    const manager = managers.find(m => m.id === managerId)
    return manager?.name || '-'
  }

  // Users without a manager
  const unassignedUsers = users.filter(u => !u.manager_id && u.role === 'colaborador')

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.total_users}</p>
                <p className="text-xs text-gray-500">Total Usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active_users}</p>
                <p className="text-xs text-gray-500">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.total_gestores}</p>
                <p className="text-xs text-gray-500">Gestores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.total_colaboradores}</p>
                <p className="text-xs text-gray-500">Colaboradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="users" className="data-[state=active]:bg-[#043F8D] data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-[#043F8D] data-[state=active]:text-white">
            <Building2 className="h-4 w-4 mr-2" />
            Equipes
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Gerenciar Usuarios</CardTitle>
                  <CardDescription>Adicione, edite ou desative usuarios do sistema</CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#F58300] hover:bg-[#e07600]">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Usuario</DialogTitle>
                      <DialogDescription>Preencha os dados para criar um novo usuario</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input id="name" name="name" required placeholder="Nome completo" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" name="email" type="email" required placeholder="email@empresa.com" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Senha</Label>
                          <Input id="password" name="password" type="password" required minLength={6} placeholder="Min. 6 caracteres" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Cargo</Label>
                          <Select name="role" defaultValue="colaborador">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="colaborador">Colaborador</SelectItem>
                              <SelectItem value="gestor">Gestor</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="department">Departamento</Label>
                          <Input id="department" name="department" placeholder="Ex: Vendas, Tech..." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="position">Funcao</Label>
                          <Input id="position" name="position" placeholder="Ex: Analista, Diretor..." />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manager_id">Gestor</Label>
                        <Select name="manager_id" defaultValue="none">
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um gestor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem gestor</SelectItem>
                            {managers.map(manager => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={loading} className="w-full bg-[#F58300] hover:bg-[#e07600]">
                        {loading ? 'Criando...' : 'Criar Usuario'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os cargos</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Usuario</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Gestor</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id} className={user.is_active === false ? 'opacity-50 bg-gray-50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-[#043F8D] text-white text-xs">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{getManagerName(user.manager_id)}</TableCell>
                        <TableCell className="text-sm">{user.department || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={user.is_active !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                            {user.is_active !== false ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user)
                                setIsEditOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUserId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(user)}
                                className={user.is_active !== false ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}
                              >
                                {user.is_active !== false ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Nenhum usuario encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Managers and their teams */}
            {managers.map(manager => {
              const teamMembers = getTeamMembers(manager.id)
              return (
                <Card key={manager.id} className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[#043F8D] text-white">
                            {manager.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{manager.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {ROLE_LABELS[manager.role]} • {teamMembers.length} membro(s)
                          </CardDescription>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedManagerForTeam(manager)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar a equipe de {manager.name}</DialogTitle>
                            <DialogDescription>Selecione colaboradores para adicionar a esta equipe</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {unassignedUsers.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">
                                Todos os colaboradores ja estao em equipes
                              </p>
                            ) : (
                              unassignedUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                        {user.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">{user.name}</p>
                                      <p className="text-xs text-gray-500">{user.position || user.department || 'Sem cargo'}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddToTeam(user.id, manager.id)}
                                    className="bg-[#F58300] hover:bg-[#e07600]"
                                  >
                                    Adicionar
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        Nenhum membro na equipe
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {teamMembers.map(member => (
                          <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-white text-gray-600 text-xs border">
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.position || member.department || 'Colaborador'}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromTeam(member.id)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {/* Unassigned users card */}
            {unassignedUsers.length > 0 && (
              <Card className="border-0 shadow-sm border-dashed border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-gray-600">Sem Equipe</CardTitle>
                      <CardDescription className="text-xs">
                        {unassignedUsers.length} colaborador(es) sem gestor
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {unassignedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-white text-gray-600 text-xs border">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.position || 'Colaborador'}</p>
                          </div>
                        </div>
                        <Select onValueChange={(managerId) => handleAddToTeam(user.id, managerId)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue placeholder="Atribuir..." />
                          </SelectTrigger>
                          <SelectContent>
                            {managers.map(manager => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Atualize as informacoes do usuario</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input id="edit-name" name="name" defaultValue={editingUser.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Cargo</Label>
                  <Select name="role" defaultValue={editingUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colaborador">Colaborador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-manager">Gestor</Label>
                  <Select name="manager_id" defaultValue={editingUser.manager_id || 'none'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem gestor</SelectItem>
                      {managers.filter(m => m.id !== editingUser.id).map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Departamento</Label>
                  <Input id="edit-department" name="department" defaultValue={editingUser.department || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Funcao</Label>
                  <Input id="edit-position" name="position" defaultValue={editingUser.position || ''} />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#F58300] hover:bg-[#e07600]">
                {loading ? 'Salvando...' : 'Salvar Alteracoes'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
