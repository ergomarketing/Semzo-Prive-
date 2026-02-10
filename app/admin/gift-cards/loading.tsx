import { RefreshCw } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
