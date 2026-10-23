"use client"

// SSR cache invalidation: 2026-05-13T20:00 (fase A v3 - render visible loading + diagnostico)
import type React from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Crown, ShoppingBag, Clock, Heart, LogOut, Gift, Home, User, UserPlus, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/app/hooks/useAuth"
import { useTranslations } from "next-intl"

export default function DashboardLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode
  user: SupabaseUser
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut, loading } = useAuth()
  const t = useTranslations("dashboardLayout")

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  // Menu en grupos (antes: 7 enlaces sueltos, y "Mi perfil" y "Dirección de envío" con el mismo icono).
  // "Perfil y envío" es una sola entrada: dentro, pestañas para pasar de una pagina a otra (AccountTabs).
  const home = { title: t("menuHome"), icon: Home, href: "/dashboard", match: ["/dashboard"] }
  const groups = [
    {
      label: t("groupBags"),
      items: [
        { title: t("myReservations"), icon: ShoppingBag, href: "/dashboard/reservas", match: ["/dashboard/reservas"] },
        { title: t("menuFavorites"), icon: Heart, href: "/dashboard/favoritos", match: ["/dashboard/favoritos"] },
        { title: t("waitlist"), icon: Clock, href: "/dashboard/lista-espera", match: ["/dashboard/lista-espera"] },
      ],
    },
    {
      label: t("groupMembership"),
      items: [
        { title: t("menuPlan"), icon: Crown, href: "/dashboard/membresia", match: ["/dashboard/membresia"] },
        { title: t("menuGiftCards"), icon: Gift, href: "/dashboard/gift-cards", match: ["/dashboard/gift-cards"] },
      ],
    },
    {
      label: t("groupAccount"),
      items: [
        { title: t("menuProfileShipping"), icon: User, href: "/dashboard/perfil", match: ["/dashboard/perfil", "/dashboard/envio"] },
        { title: t("menuInvite"), icon: UserPlus, href: "/dashboard/referidos", match: ["/dashboard/referidos"] },
      ],
    },
    {
      label: t("groupHelp"),
      items: [{ title: t("menuHelp"), icon: LifeBuoy, href: "/support", match: ["/support"] }],
    },
  ]

  const isActive = (match: string[]) => match.some((m) => (m === "/dashboard" ? pathname === m : pathname.startsWith(m)))
  const activeTitle =
    [home, ...groups.flatMap((g) => g.items)].find((item) => isActive(item.match))?.title ?? t("menuHome")

  // Estilo del apartado activo: fondo suave, texto de marca y filo dorado a la izquierda.
  const itemClass =
    "font-serif text-slate-700 hover:text-indigo-dark hover:bg-rose-nude/40 data-[active=true]:bg-rose-nude/60 data-[active=true]:font-medium data-[active=true]:text-indigo-dark data-[active=true]:shadow-[inset_2px_0_0_#b08d57]"

  const userName =
    user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1)} ${user.user_metadata.last_name.charAt(0).toUpperCase() + user.user_metadata.last_name.slice(1)}`
      : user?.user_metadata?.first_name
        ? user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1)
        : "Usuario"

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-slate-50">
        {/* Menu lateral: visible en ordenador desde el principio; en movil se abre con el boton de arriba. */}
        <Sidebar className="border-r border-indigo-dark/10" collapsible="offcanvas">
          <SidebarHeader className="border-b border-indigo-dark/10 p-6">
            <Link href="/" className="group">
              <span className="text-xl font-serif tracking-wide text-indigo-dark transition-colors group-hover:text-indigo-dark/80">
                Semzo Privé
              </span>
            </Link>
            <p className="mt-2 text-sm font-serif text-slate-600">{t("welcome", { name: userName })}</p>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(home.match)} className={itemClass}>
                  <Link href={home.href}>
                    <home.icon className="h-4 w-4" />
                    <span>{home.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {groups.map((group) => (
              <SidebarGroup key={group.label} className="pt-4">
                <SidebarGroupLabel className="mb-1 text-[11px] uppercase tracking-[0.2em] text-[#b08d57]">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive(item.match)} className={itemClass}>
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-indigo-dark/10 p-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start border-indigo-dark/15 bg-transparent font-serif text-slate-700 hover:bg-rose-nude/40"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("signOut")}
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-indigo-dark/10 bg-white px-4 md:px-6">
            <SidebarTrigger className="shrink-0 text-slate-700" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="truncate text-lg font-serif text-slate-600">{activeTitle}</h1>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
