import { Badge } from "@/components/ui/badge"
import { CheckCircle, MinusCircle, XCircle } from "lucide-react"
import type { ClientStatus } from "@/types/business"

interface ClientStatusBadgeProps {
  status: ClientStatus
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <CheckCircle className="mr-1 h-3 w-3" />
          Active
        </Badge>
      )
    case "INACTIVE":
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
          <MinusCircle className="mr-1 h-3 w-3" />
          Inactive
        </Badge>
      )
    case "SUSPENDED":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
          <XCircle className="mr-1 h-3 w-3" />
          Suspended
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
