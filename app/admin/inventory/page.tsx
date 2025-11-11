import InventorySystem from "../../components/inventory-system"
import ReservationCalendar from "../../components/reservation-calendar"
import Navbar from "../../components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminInventoryPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-serif text-slate-900 mb-2">Panel de Administración</h1>
            <p className="text-slate-600">Gestiona el inventario y reservas de bolsos</p>
          </div>

          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="inventory">Inventario</TabsTrigger>
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="mt-6">
              <InventorySystem />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <ReservationCalendar />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
