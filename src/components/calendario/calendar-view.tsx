'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Profile,
  EventWithDetails,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  EventType,
  EventVisibility,
} from '@/types/database'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface CalendarViewProps {
  events: EventWithDetails[]
  profile: Profile | null
}

export function CalendarView({ events, profile }: CalendarViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    event_type: 'meeting' as EventType,
    visibility: 'team' as EventVisibility,
    start_time: '',
    end_time: '',
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { locale: ptBR })
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (date: Date) => {
    return events.filter(event =>
      isSameDay(new Date(event.start_time), date)
    )
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.start_time || !newEvent.end_time) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          creator_id: profile?.id,
          title: newEvent.title,
          description: newEvent.description || null,
          location: newEvent.location || null,
          event_type: newEvent.event_type,
          visibility: newEvent.visibility,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          color: EVENT_TYPE_COLORS[newEvent.event_type],
        })

      if (error) throw error

      toast.success('Evento criado!')
      setShowEventDialog(false)
      setNewEvent({
        title: '',
        description: '',
        location: '',
        event_type: 'meeting',
        visibility: 'team',
        start_time: '',
        end_time: '',
      })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar evento')
    } finally {
      setLoading(false)
    }
  }

  const dayEvents = selectedDate ? getEventsForDay(selectedDate) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Calendario
          </h2>
          <p className="text-muted-foreground">
            {events.length} evento(s) este mes
          </p>
        </div>
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Evento</DialogTitle>
              <DialogDescription>
                Crie um novo evento no calendario
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label>Titulo *</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Nome do evento"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newEvent.event_type}
                    onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v as EventType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibilidade</Label>
                  <Select
                    value={newEvent.visibility}
                    onValueChange={(v) => setNewEvent({ ...newEvent, visibility: v as EventVisibility })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Privado</SelectItem>
                      <SelectItem value="team">Equipe</SelectItem>
                      <SelectItem value="department">Departamento</SelectItem>
                      <SelectItem value="company">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inicio *</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim *</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local (opcional)</Label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Local ou link da reuniao"
                />
              </div>
              <div className="space-y-2">
                <Label>Descricao (opcional)</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Detalhes do evento"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEventDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Evento'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(day => {
                const dayEvts = getEventsForDay(day)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, currentMonth)

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors',
                      isCurrentMonth ? 'bg-background' : 'bg-muted/30',
                      isSelected && 'ring-2 ring-[#F58300]',
                      'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <p
                      className={cn(
                        'text-sm font-medium mb-1',
                        !isCurrentMonth && 'text-muted-foreground',
                        isToday && 'text-[#F58300]'
                      )}
                    >
                      {format(day, 'd')}
                    </p>
                    <div className="space-y-0.5">
                      {dayEvts.slice(0, 2).map(evt => (
                        <div
                          key={evt.id}
                          className="text-xs truncate px-1 py-0.5 rounded"
                          style={{ backgroundColor: evt.color + '30', color: evt.color }}
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dayEvts.length > 2 && (
                        <p className="text-xs text-muted-foreground px-1">
                          +{dayEvts.length - 2} mais
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
                : 'Selecione um dia'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              dayEvents.length > 0 ? (
                <div className="space-y-3">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-3 border rounded-lg space-y-2"
                      style={{ borderLeftColor: event.color, borderLeftWidth: 4 }}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-medium">{event.title}</p>
                        <Badge
                          style={{
                            backgroundColor: event.color + '30',
                            color: event.color,
                          }}
                        >
                          {EVENT_TYPE_LABELS[event.event_type]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(event.start_time), 'HH:mm')} -{' '}
                          {format(new Date(event.end_time), 'HH:mm')}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum evento neste dia
                </p>
              )
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Clique em um dia para ver os eventos
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
