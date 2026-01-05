'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORY_LABELS, STATUS_LABELS, GoalCategory, GoalStatus } from '@/types/database'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function MetaFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [search, setSearch] = useState(searchParams.get('q') || '')

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar metas..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            updateFilters('q', e.target.value)
          }}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <Select
        value={category}
        onValueChange={(value) => {
          setCategory(value)
          updateFilters('category', value)
        }}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas categorias</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={status}
        onValueChange={(value) => {
          setStatus(value)
          updateFilters('status', value)
        }}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos status</SelectItem>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
