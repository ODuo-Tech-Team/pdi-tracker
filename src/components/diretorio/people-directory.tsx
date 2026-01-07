'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Profile,
  AREA_LABELS,
  AREA_COLORS,
  AreaType,
  ROLE_LABELS,
} from '@/types/database'
import {
  Search,
  Users2,
  Mail,
  Phone,
  Building2,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PeopleDirectoryProps {
  people: Profile[]
  departments: string[]
  positions: string[]
  currentUserId: string
}

export function PeopleDirectory({
  people,
  departments,
  positions,
  currentUserId,
}: PeopleDirectoryProps) {
  const [search, setSearch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)

  const filteredPeople = people.filter(person => {
    const matchesSearch =
      search === '' ||
      person.name.toLowerCase().includes(search.toLowerCase()) ||
      person.email.toLowerCase().includes(search.toLowerCase()) ||
      person.department?.toLowerCase().includes(search.toLowerCase()) ||
      person.position?.toLowerCase().includes(search.toLowerCase())

    const matchesDepartment =
      !selectedDepartment || person.department === selectedDepartment

    const matchesPosition =
      !selectedPosition || person.position === selectedPosition

    return matchesSearch && matchesDepartment && matchesPosition
  })

  const clearFilters = () => {
    setSearch('')
    setSelectedDepartment(null)
    setSelectedPosition(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users2 className="h-6 w-6" />
            Diretorio de Pessoas
          </h2>
          <p className="text-muted-foreground">
            {people.length} colaborador(es) ativos
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, cargo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedDepartment || 'all'}
              onValueChange={(v) => setSelectedDepartment(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedPosition || 'all'}
              onValueChange={(v) => setSelectedPosition(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {positions.map(pos => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || selectedDepartment || selectedPosition) && (
              <Button variant="ghost" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <p className="text-sm text-muted-foreground">
        {filteredPeople.length} resultado(s)
      </p>

      {/* People Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPeople.map((person) => (
          <Link key={person.id} href={`/dashboard/diretorio/${person.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-16 w-16 mb-4">
                    <AvatarFallback className="text-xl bg-[#043F8D] text-white">
                      {person.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{person.name}</h3>
                  {person.position && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {person.position}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {person.department && (
                      <Badge variant="outline" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        {person.department}
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="text-xs capitalize"
                    >
                      {ROLE_LABELS[person.role]}
                    </Badge>
                  </div>
                  {person.id === currentUserId && (
                    <Badge className="mt-2 bg-[#F58300]">Voce</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredPeople.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum resultado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros de busca
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
