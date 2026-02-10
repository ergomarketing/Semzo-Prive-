"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2, Copy, Check } from "lucide-react"

interface ImageUploaderProps {
  onImageUploaded?: (url: string) => void
  label?: string
}

export function ImageUploader({ onImageUploaded, label = "Imagen del Artículo" }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Solo se permiten archivos de imagen")
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al subir la imagen")
      }

      const data = await response.json()
      setImageUrl(data.url)
      onImageUploaded?.(data.url)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error al subir la imagen")
      setPreviewUrl("")
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(imageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setImageUrl("")
    setPreviewUrl("")
    onImageUploaded?.("")
  }

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {!imageUrl && !previewUrl ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-3">Sube una imagen desde tu ordenador</p>
          <label htmlFor="image-upload">
            <Button asChild className="bg-[#1a2c4e] hover:bg-[#1a2c4e]/90" disabled={uploading}>
              <span className="cursor-pointer">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar Imagen
                  </>
                )}
              </span>
            </Button>
          </label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative border rounded-lg overflow-hidden">
            <img
              src={imageUrl || previewUrl}
              alt="Imagen subida"
              className="w-full h-auto max-h-[400px] object-contain"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeImage}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {imageUrl && (
            <>
              <div className="flex gap-2">
                <Input value={imageUrl} readOnly className="flex-1 font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyToClipboard} type="button">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <p className="text-xs text-gray-600">
                URL copiada. Inserta en Markdown:{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">![alt]({imageUrl})</code>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
