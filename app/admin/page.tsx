import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, FileText } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-6">Panel de Administración</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Probador de Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Prueba el envío de diferentes tipos de emails a los usuarios.</p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/email-tester" className="w-full">
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Ir al probador
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Logs de Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Visualiza todos los emails enviados y su estado.</p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/email-logs" className="w-full">
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Ver logs
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
