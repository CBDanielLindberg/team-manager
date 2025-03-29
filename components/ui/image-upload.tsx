'use client'

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { ImagePlus, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  teamId: string
}

export function ImageUpload({ value, onChange, teamId }: ImageUploadProps) {
  const [loading, setLoading] = useState(false)

  const handleUpload = useCallback(async (file: File) => {
    try {
      setLoading(true)

      // Skapa en unik filnamn
      const fileExt = file.name.split('.').pop()
      const fileName = `${teamId}-${Math.random()}.${fileExt}`
      const filePath = `team-thumbnails/${fileName}`

      // Ladda upp till Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('teams')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Hämta public URL
      const { data: { publicUrl } } = supabase.storage
        .from('teams')
        .getPublicUrl(filePath)

      onChange(publicUrl)

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [teamId, onChange])

  const handleRemove = useCallback(() => {
    onChange(null)
  }, [onChange])

  return (
    <div className="flex items-center gap-4">
      {value ? (
        <div className="relative">
          <img 
            src={value} 
            alt="Team thumbnail" 
            className="h-16 w-16 rounded-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="cursor-pointer">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
            disabled={loading}
          />
        </label>
      )}
      {loading && <div className="text-sm text-muted-foreground">Uploading...</div>}
    </div>
  )
} 