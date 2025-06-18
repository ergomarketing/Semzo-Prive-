import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function EmailDebugPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Herramientas de Depuración de Emails</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Probador Simple</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Versión simplificada para probar la funcionalidad básica.</p>
            <Link href="/admin/email-test-simple">
              <Button>Ir al probador simple</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Envío de Email Real</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Prueba el envío real de emails con tu proveedor configurado.</p>
            <Link href="/admin/email-send-test">
              <Button>Probar envío real</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
