import { redirect } from "next/navigation"

/** La lista de favoritos vive ahora dentro del panel de la socia. Se mantiene esta ruta para no romper enlaces. */
export default function WishlistPage() {
  redirect("/dashboard/favoritos")
}
