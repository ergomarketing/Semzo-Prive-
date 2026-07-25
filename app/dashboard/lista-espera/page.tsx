"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-slate-900 mb-2">{t("title")}</h2>
        <p className="text-slate-600">{t("subtitle")}</p>
      </div>

      {waitlistItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-xl font-serif text-slate-900 mb-2">{t("empty")}</h3>
            <p className="text-slate-600 text-center mb-6">{t("emptyDesc")}</p>
            <Button
              onClick={() => (window.location.href = "/catalog")}
              className="bg-slate-900 hover:bg-slate-800 text-white font-serif"
            >
              <Package className="h-4 w-4 mr-2" />
              {t("exploreCatalog")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {waitlistItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
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
                  <h3 className="text-lg font-serif text-slate-900">{item.bags?.name || t("unknownBag")}</h3>
                  <p className="text-sm text-slate-600">{item.bags?.brand || t("unknownBrand")}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-rose-200">
                      <Bell className="h-3 w-3 mr-1" />
                      {t("waiting")}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {t("addedOn")} {new Date(item.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "es-ES")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 font-serif bg-transparent"
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
