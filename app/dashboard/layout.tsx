"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../hooks/useAuth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { User, MapPin, Crown, ShoppingBag, Clock, Heart, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    if (!loading) {
      setHasCheckedAuth(true)
      if (!user) {
        router.push("/auth/login")
      }
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const menuItems = [
    {
      title: "Mi Perfil",
      icon: User,
      href: "/dashboard/perfil",
    },
    {
      title: "Dirección de Envío",
      icon: MapPin,
      href: "/dashboard/envio",
    },
    {
      title: "Mi Membresía",
      icon: Crown,
      href: "/dashboard/membresia",
    },
    {
      title: "Mis Reservas",
      icon: ShoppingBag,
      href: "/dashboard/reservas",
    },
    {
      title: "Lista de Espera",
      icon: Clock,
      href: "/dashboard/lista-espera",
    },
    {
      title: "Mi Wishlist",
      icon: Heart,
      href: "/wishlist",
    },
  ]

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userName =
    user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1)} ${user.user_metadata.last_name.charAt(0).toUpperCase() + user.user_metadata.last_name.slice(1)}`
      : user?.user_metadata?.first_name
        ? user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1)
        : "Usuario"

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <Link href="/" className="group">
              <span className="text-xl font-serif text-indigo-dark group-hover:text-indigo-dark/80 transition-colors">
                Semzo Privé
              </span>
            </Link>
            <p className="text-sm text-slate-600 font-serif mt-2">Bienvenida</p>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="font-serif text-slate-700 hover:text-indigo-dark hover:bg-rose-nude/30"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100 font-serif bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6">
            <SidebarTrigger className="text-slate-700" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-serif text-slate-600">Dashboard</h1>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
