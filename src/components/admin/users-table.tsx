'use client'

import { useState } from 'react'
import { Profile, UserRole, ROLE_LABELS } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Search, Plus, Pencil, UserX, UserCheck, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UsersTableProps {
  users: Profile[]
  managers: Profile[]
  currentUserId: string
}

export function UsersTable({ users: initialUsers, managers, currentUserId }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedManager, setSelectedManager] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                          user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'active' && user.is_active !== false) ||
                          (statusFilter === 'inactive' && user.is_active === false)
    return matchesSearch && matchesRole && matchesStatus
  })

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

    // Create auth user
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
      // Update profile with additional data
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
        toast.success('Usuário criado com sucesso!')
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
      toast.error('Erro ao atualizar usuário')
    } else {
      toast.success('Usuário atualizado!')
      setUsers(users.map(u =>
        u.id === editingUser.id
          ? { ...u, name, role, manager_id: managerId || null, department, position }
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
      toast.success(newStatus ? 'Usuário reativado!' : 'Usuário desativado!')
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, is_active: newStatus } : u
      ))
    }
  }

  // Assign multiple users to a manager
  const handleAssignTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedManager) return
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const selectedUserIds = formData.getAll('users') as string[]

    // Update all selected users
    const { error } = await supabase
      .from('profiles')
      .update({ manager_id: selectedManager.id })
      .in('id', selectedUserIds)

    if (error) {
      toast.error('Erro ao atribuir equipe')
    } else {
      toast.success('Equipe atribuída com sucesso!')
      setUsers(users.map(u =>
        selectedUserIds.includes(u.id) ? { ...u, manager_id: selectedManager.id } : u
      ))
      setIsAssignOpen(false)
      setSelectedManager(null)
    }

    setLoading(false)
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700'
      case 'gestor': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return '-'
    const manager = managers.find(m => m.id === managerId)
    return manager?.name || '-'
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-[#043F8D]">
            Usuários ({filteredUsers.length})
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Atribuir Equipe
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Atribuir Equipe a um Gestor</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAssignTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Selecione o Gestor</Label>
                    <Select onValueChange={(value) => setSelectedManager(managers.find(m => m.id === value) || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um gestor" />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map(manager => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name} ({ROLE_LABELS[manager.role]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedManager && (
                    <div className="space-y-2">
                      <Label>Selecione os Colaboradores</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                        {users
                          .filter(u => u.role === 'colaborador' && u.id !== selectedManager.id)
                          .map(user => (
                            <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                name="users"
                                value={user.id}
                                defaultChecked={user.manager_id === selectedManager.id}
                                className="rounded"
                              />
                              <span>{user.name}</span>
                              {user.manager_id && user.manager_id !== selectedManager.id && (
                                <span className="text-xs text-gray-400">
                                  (atual: {getManagerName(user.manager_id)})
                                </span>
                              )}
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                  <Button type="submit" disabled={loading || !selectedManager} className="w-full bg-[#F58300] hover:bg-[#e07600]">
                    {loading ? 'Salvando...' : 'Salvar Atribuições'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#F58300] hover:bg-[#e07600]">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input id="password" name="password" type="password" required minLength={6} />
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
                      <Input id="department" name="department" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Função</Label>
                      <Input id="position" name="position" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager_id">Gestor (opcional)</Label>
                    <Select name="manager_id">
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
                    {loading ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="gestor">Gestor</SelectItem>
              <SelectItem value="colaborador">Colaborador</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Gestor</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id} className={user.is_active === false ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>{getManagerName(user.manager_id)}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    <Badge className={user.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {user.is_active !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                          className={user.is_active !== false ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
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
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
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
                    <Select name="manager_id" defaultValue={editingUser.manager_id || ''}>
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
                    <Label htmlFor="edit-position">Função</Label>
                    <Input id="edit-position" name="position" defaultValue={editingUser.position || ''} />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[#F58300] hover:bg-[#e07600]">
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
