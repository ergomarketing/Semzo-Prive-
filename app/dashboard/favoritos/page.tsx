"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, Loader2, Package, ShoppingBag } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/panel/card"
import { PageHeader, PanelEmpty } from "@/components/panel/page-header"
import { useAuth } from "../../hooks/useAuth"
import { supabase } from "../../lib/supabase"

interface FavoriteItem {
  id: string
  bag_id: string
  created_at: string
  bags: {
    name: string | null
    brand: string | null
    image_url: string | null
    slug: string | null
    status: string | null
  } | null
}

const isAvailable = (status: string | null | undefined) => (status || "").toLowerCase() === "available"

/** Bolsos que la socia ha marcado con el corazon en el catalogo. */
export default function FavoritosPage() {
  const t = useTranslations("favoritosPage")
  const locale = useLocale()
  const { user } = useAuth()
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from("wishlists")
          .select("id, bag_id, created_at, bags(name, brand, image_url, slug, status)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        if (error) throw error
        setItems((data as unknown as FavoriteItem[]) || [])
      } catch (error) {
        console.error("Error cargando favoritos:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleRemove = async (item: FavoriteItem) => {
    if (!user) return
    setRemoving(item.id)
    try {
      const { error } = await supabase.from("wishlists").delete().eq("user_id", user.id).eq("id", item.id)
      if (error) throw error
      setItems((current) => current.filter((i) => i.id !== item.id))
      toast.success(t("removed"))
    } catch (error) {
      console.error("Error quitando favorito:", error)
      toast.error(t("removeError"))
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {items.length === 0 ? (
        <Card>
          <PanelEmpty
            icon={<Heart className="h-6 w-6" />}
            title={t("empty")}
            text={t("emptyDesc")}
            action={
              <Button
                onClick={() => (window.location.href = "/catalog")}
                className="h-11 rounded-md bg-indigo-dark px-6 text-xs font-medium uppercase tracking-[0.18em] text-white hover:bg-indigo-dark/90"
              >
                <ShoppingBag className="mr-2 h-4 w-4 text-[#d9bd8a]" />
                {t("explore")}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const bag = item.bags
            const available = isAvailable(bag?.status)
            return (
              <Card key={item.id} className="overflow-hidden transition-colors hover:border-indigo-dark/25">
                <Link href={`/catalog/${bag?.slug || item.bag_id}`} className="block">
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-rose-nude/60">
                    {bag?.image_url ? (
                      <img src={bag.image_url} alt={bag.name || ""} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-10 w-10 text-slate-300" />
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${
                        available ? "bg-[#b08d57]/90 text-white" : "bg-white/90 text-slate-600"
                      }`}
                    >
                      {available ? t("available") : t("inUse")}
                    </span>
                  </div>
                </Link>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{bag?.brand || t("unknownBrand")}</p>
                  <h3 className="mt-1 truncate font-serif text-xl text-indigo-dark">{bag?.name || t("unknownBag")}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("savedOn")} {new Date(item.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "es-ES")}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      asChild
                      className="h-10 flex-1 rounded-md bg-indigo-dark text-xs font-medium uppercase tracking-[0.16em] text-white hover:bg-indigo-dark/90"
                    >
                      <Link href={`/catalog/${bag?.slug || item.bag_id}`}>{t("view")}</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemove(item)}
                      disabled={removing === item.id}
                      aria-label={t("remove")}
                      className="h-10 w-10 border-indigo-dark/15 bg-transparent text-[#b08d57] hover:bg-rose-nude/40"
                    >
                      {removing === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4 fill-current" />}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
