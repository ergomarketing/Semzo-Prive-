"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Trash2, ExternalLink, Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { defaultPosts } from "@/utils/blog"

interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  image?: string
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state for new post
  const [newPost, setNewPost] = useState({
    title: "",
    slug: "",
    excerpt: "",
    author: "Semzo Privé",
    content: "",
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/blog")
      if (response.ok) {
        const data = await response.json()
        setPosts(data.length > 0 ? data : defaultPosts)
      } else {
        setPosts(defaultPosts)
      }
    } catch {
      setPosts(defaultPosts)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".md")) {
      alert("Solo se permiten archivos Markdown (.md)")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/blog", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        alert("Artículo subido correctamente")
        fetchPosts()
      } else {
        const error = await response.json()
        alert(error.error || "Error al subir el archivo")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Error al subir el archivo")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPost.title || !newPost.slug || !newPost.content) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    setCreating(true)
    try {
      const formData = new FormData()
      formData.append("title", newPost.title)
      formData.append("slug", newPost.slug)
      formData.append("excerpt", newPost.excerpt)
      formData.append("author", newPost.author)
      formData.append("content", newPost.content)

      const response = await fetch("/api/blog", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        alert("Artículo creado correctamente")
        setNewPost({ title: "", slug: "", excerpt: "", author: "Semzo Privé", content: "" })
        fetchPosts()
      } else {
        const error = await response.json()
        alert(error.error || "Error al crear el artículo")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Error al crear el artículo")
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePost = async (slug: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este artículo?")) return

    try {
      const response = await fetch(`/api/blog?slug=${slug}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Artículo eliminado correctamente")
        fetchPosts()
      } else {
        alert("Error al eliminar el artículo")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Error al eliminar el artículo")
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-serif text-[#1a2c4e]">Gestión de Semzo Magazine</CardTitle>
              <CardDescription>Administra los artículos del blog</CardDescription>
            </div>
            <div className="flex gap-3">
              <a href="https://opinly.ai/dashboard" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <ExternalLink className="h-4 w-4" />
                  Ir a Opinly (SEO)
                </Button>
              </a>
              <Link href="/blog" target="_blank">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <ExternalLink className="h-4 w-4" />
                  Ver Blog Público
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Artículos Publicados</TabsTrigger>
          <TabsTrigger value="create">Crear Nuevo</TabsTrigger>
          <TabsTrigger value="upload">Subir Markdown</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Artículos Publicados ({posts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1a2c4e]" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay artículos publicados. Crea tu primer artículo.</p>
              ) : (
                <ul className="space-y-4">
                  {posts.map((post) => (
                    <li
                      key={post.slug}
                      className="flex justify-between items-center p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-5 w-5 text-[#1a2c4e]" />
                        <div>
                          <p className="font-medium text-[#1a2c4e]">{post.title}</p>
                          <p className="text-xs text-gray-500">
                            Slug: {post.slug} | Autor: {post.author} | Fecha: {post.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </Link>
                        <Button variant="destructive" size="sm" onClick={() => handleDeletePost(post.slug)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Artículo</CardTitle>
              <CardDescription>Escribe directamente el contenido de tu artículo</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={newPost.title}
                      onChange={(e) => {
                        setNewPost({
                          ...newPost,
                          title: e.target.value,
                          slug: generateSlug(e.target.value),
                        })
                      }}
                      placeholder="Título del artículo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={newPost.slug}
                      onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                      placeholder="url-del-articulo"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Autor</Label>
                    <Input
                      id="author"
                      value={newPost.author}
                      onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                      placeholder="Nombre del autor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Resumen</Label>
                    <Input
                      id="excerpt"
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                      placeholder="Breve descripción del artículo"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenido (Markdown) *</Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Escribe el contenido en formato Markdown..."
                    className="min-h-[300px] font-mono"
                    required
                  />
                </div>

                <Button type="submit" className="bg-[#1a2c4e] hover:bg-[#1a2c4e]/90" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Artículo
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Subir Archivo Markdown</CardTitle>
              <CardDescription>Sube un archivo .md con frontmatter para crear un artículo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Arrastra un archivo Markdown aquí o haz clic para seleccionar</p>
                <label htmlFor="file-upload">
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
                          Seleccionar Archivo (.md)
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".md"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>

              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="font-semibold mb-2 text-[#1a2c4e]">Ejemplo de Frontmatter:</p>
                <pre className="bg-gray-200 p-3 rounded text-sm overflow-x-auto">
                  {`---
title: "Título del Artículo"
date: "AAAA-MM-DD"
author: "Tu Nombre"
excerpt: "Resumen corto para la lista de posts."
image: "/ruta/a/tu/imagen.jpg"
slug: "titulo-en-minusculas-separado-por-guiones"
---

Tu contenido en Markdown aquí...`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
