"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent } from "@/components/panel/card"
import { PageHeader, PanelEmpty } from "@/components/panel/page-header"
import { Button } from "@/components/ui/button"
import { Clock, Loader2, Package, Bell } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useTranslations, useLocale } from "next-intl"

interface WaitlistItem {
  id: string
  bag_id: string
  created_at: string
  bags: {
    name: string
    brand: string
    image_url: string
  }
}

export default function ListaEsperaPage() {
  const t = useTranslations("listaEsperaPage")
  const locale = useLocale()
  const { user } = useAuth()
  const [waitlistItems, setWaitlistItems] = useState<WaitlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWaitlist = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("waitlist")
          .select(`
            id,
            bag_id,
            created_at,
            bags (
              name,
              brand,
              image_url
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setWaitlistItems(data || [])
      } catch (error) {
        console.error("Error fetching waitlist:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWaitlist()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {waitlistItems.length === 0 ? (
        <Card>
          <PanelEmpty
            icon={<Clock className="h-6 w-6" />}
            title={t("empty")}
            text={t("emptyDesc")}
            action={
              <Button
                onClick={() => (window.location.href = "/catalog")}
                className="h-11 rounded-md bg-indigo-dark px-6 text-xs font-medium uppercase tracking-[0.18em] text-white hover:bg-indigo-dark/90"
              >
                <Package className="mr-2 h-4 w-4 text-[#d9bd8a]" />
                {t("exploreCatalog")}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {waitlistItems.map((item) => (
            <Card key={item.id} className="transition-colors hover:border-indigo-dark/25">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-rose-nude/60">
                  {item.bags?.image_url ? (
                    <img
                      src={item.bags.image_url || "/placeholder.svg"}
                      alt={item.bags?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-serif text-indigo-dark">{item.bags?.name || t("unknownBag")}</h3>
                  <p className="text-sm text-slate-600">{item.bags?.brand || t("unknownBrand")}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center rounded-full bg-[#b08d57]/15 px-3 py-1 text-xs font-medium text-[#7a5f33]">
                      <Bell className="mr-1 h-3 w-3" />
                      {t("waiting")}
                    </span>
                    <span className="text-xs text-slate-500">
                      {t("addedOn")} {new Date(item.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "es-ES")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-indigo-dark/15 bg-transparent font-serif text-slate-700 hover:bg-rose-nude/40"
                >
                  {t("remove")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
