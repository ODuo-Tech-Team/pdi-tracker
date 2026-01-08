'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AttachmentWithUploader, EntityType, Profile } from '@/types/database'
import {
  Paperclip,
  Plus,
  Download,
  Trash2,
  ExternalLink,
  Image,
  FileText,
  File,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { AttachmentUpload } from './attachment-upload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AttachmentsSectionProps {
  entityType: EntityType
  entityId: string
  profile: Profile
  initialAttachments?: AttachmentWithUploader[]
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.includes('pdf')) return FileText
  return File
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentsSection({
  entityType,
  entityId,
  profile,
  initialAttachments = [],
}: AttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<AttachmentWithUploader[]>(initialAttachments)
  const [expanded, setExpanded] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  const handleUploadComplete = (attachment: any) => {
    setAttachments((prev) => [
      { ...attachment, uploader: profile },
      ...prev,
    ])
    setDialogOpen(false)
  }

  const handleDelete = async (attachment: AttachmentWithUploader) => {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) return

    setDeleting(attachment.id)
    try {
      // Delete from storage
      const fileName = attachment.file_url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('okr-attachments')
          .remove([`${entityType}/${entityId}/${fileName}`])
      }

      // Delete from database
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id)

      if (error) throw error

      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
      toast.success('Anexo excluido!')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Erro ao excluir anexo')
    } finally {
      setDeleting(null)
    }
  }

  const isOwner = (attachment: AttachmentWithUploader) =>
    attachment.uploaded_by === profile.id

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-5 w-5" />
            Anexos
            {attachments.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({attachments.length})
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Anexo</DialogTitle>
                </DialogHeader>
                <AttachmentUpload
                  entityType={entityType as 'objective' | 'key_result' | 'kpi'}
                  entityId={entityId}
                  userId={profile.id}
                  onUploadComplete={handleUploadComplete}
                />
              </DialogContent>
            </Dialog>
            {attachments.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.mime_type)
                const isImage = attachment.mime_type?.startsWith('image/')

                return (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {/* Preview or Icon */}
                    {isImage ? (
                      <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={attachment.file_url}
                          alt={attachment.file_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.file_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(attachment.file_size)}</span>
                        {attachment.uploader && (
                          <>
                            <span>•</span>
                            <span>{attachment.uploader.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(attachment.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir em nova aba"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <a
                          href={attachment.file_url}
                          download={attachment.file_name}
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      {isOwner(attachment) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(attachment)}
                          disabled={deleting === attachment.id}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              Nenhum anexo adicionado.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
