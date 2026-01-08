'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, X, FileIcon, Image, FileText, File } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AttachmentUploadProps {
  entityType: 'objective' | 'key_result' | 'kpi'
  entityId: string
  userId: string
  onUploadComplete: (attachment: {
    id: string
    file_name: string
    file_url: string
    file_size: number
    mime_type: string
  }) => void
  maxSizeMB?: number
  acceptedTypes?: string[]
}

const defaultAcceptedTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.includes('pdf')) return FileText
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentUpload({
  entityType,
  entityId,
  userId,
  onUploadComplete,
  maxSizeMB = 10,
  acceptedTypes = defaultAcceptedTypes,
}: AttachmentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Tipo de arquivo nao permitido'
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Arquivo muito grande. Maximo: ${maxSizeMB}MB`
    }
    return null
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }
      setSelectedFile(file)
    }
  }, [acceptedTypes, maxSizeMB])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setProgress(0)

    try {
      // Generate unique file path
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${entityType}/${entityId}/${Date.now()}.${fileExt}`

      // Simulate progress (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('okr-attachments')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      clearInterval(progressInterval)

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        if (uploadError.message.includes('not found')) {
          throw new Error('Bucket de anexos nao configurado. Contate o administrador.')
        }
        throw uploadError
      }

      setProgress(95)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('okr-attachments')
        .getPublicUrl(fileName)

      // Save to attachments table
      const { data: attachment, error: dbError } = await supabase
        .from('attachments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          file_name: selectedFile.name,
          file_url: urlData.publicUrl,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          uploaded_by: userId,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setProgress(100)
      toast.success('Arquivo enviado com sucesso!')
      onUploadComplete(attachment)
      setSelectedFile(null)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const FileIcon_ = selectedFile ? getFileIcon(selectedFile.type) : FileIcon

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          uploading && 'pointer-events-none opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={uploading}
        />

        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileIcon_ className="h-8 w-8 text-muted-foreground" />
            <div className="text-left">
              <p className="font-medium text-sm">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Arraste um arquivo ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max: {maxSizeMB}MB | PDF, Imagens, Documentos
            </p>
          </>
        )}
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Enviando... {progress}%
          </p>
        </div>
      )}

      {/* Upload button */}
      {selectedFile && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Enviar Arquivo
        </Button>
      )}
    </div>
  )
}
