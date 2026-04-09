"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowser } from "@/app/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GripVertical, Save, RotateCcw } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Bag {
  id: string
  name: string
  brand: string
  image_url: string
  membership_type: string
  display_order: number
}

function SortableBagItem({ bag }: { bag: Bag }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bag.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const membershipColors = {
    essentiel: "bg-rose-nude/20 text-slate-900",
    signature: "bg-rose-pastel/30 text-slate-900",
    prive: "bg-indigo-dark/20 text-indigo-dark",
  }

  const membershipNames = {
    essentiel: "L'Essentiel",
    signature: "Signature",
    prive: "Privé",
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card className="p-3 bg-white hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-100 rounded"
          >
            <GripVertical className="h-5 w-5 text-slate-400" />
          </button>

          <div className="relative h-16 w-16 flex-shrink-0">
            <Image
              src={bag.image_url || "/placeholder.svg"}
              alt={bag.name}
              fill
              className="object-contain rounded"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {bag.brand} {bag.name}
            </p>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                membershipColors[bag.membership_type as keyof typeof membershipColors]
              }`}
            >
              {membershipNames[bag.membership_type as keyof typeof membershipNames]}
            </span>
          </div>

          <div className="text-sm text-slate-500">#{bag.display_order}</div>
        </div>
      </Card>
    </div>
  )
}

export default function BagOrderManager() {
  const [bags, setBags] = useState<Bag[]>([])
  const [originalBags, setOriginalBags] = useState<Bag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    loadBags()
  }, [])

  useEffect(() => {
    const changed = JSON.stringify(bags.map((b) => b.id)) !== JSON.stringify(originalBags.map((b) => b.id))
    setHasChanges(changed)
  }, [bags, originalBags])

  const loadBags = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("bags")
        .select("id, name, brand, image_url, membership_type, display_order")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("brand", { ascending: true })

      if (error) throw error

      if (data) {
        setBags(data)
        setOriginalBags(data)
      }
    } catch (error) {
      console.error("Error loading bags:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los bolsos",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    setBags((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Actualizar display_order de todos los bolsos según su nueva posición
      const updates = bags.map((bag, index) => ({
        id: bag.id,
        display_order: index + 1,
      }))

      // Usar API endpoint que revalida el cache del catálogo
      const response = await fetch("/api/admin/bags/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar")
      }

      setOriginalBags([...bags])
      setHasChanges(false)

      toast({
        title: "✅ Orden guardado",
        description: "El catálogo se actualizará automáticamente",
      })
    } catch (error) {
      console.error("Error saving order:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el orden",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setBags([...originalBags])
    setHasChanges(false)
  }

  if (loading) {
    return (
      <Card className="p-8">
        <p className="text-center text-slate-600">Cargando bolsos...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-slate-900">Ordenar Catálogo</h2>
          <p className="text-sm text-slate-600 mt-1">Arrastra los bolsos para cambiar su orden en el catálogo</p>
        </div>

        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || saving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Orden"}
          </Button>
        </div>
      </div>

      {bags.length === 0 ? (
        <Card className="p-8">
          <p className="text-center text-slate-600">No hay bolsos en el catálogo</p>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={bags.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {bags.map((bag) => (
                <SortableBagItem key={bag.id} bag={bag} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {hasChanges && (
        <div className="sticky bottom-4 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg">
          <p className="text-sm text-amber-900 font-medium">
            ⚠️ Tienes cambios sin guardar. No olvides hacer clic en "Guardar Orden"
          </p>
        </div>
      )}
    </div>
  )
}
