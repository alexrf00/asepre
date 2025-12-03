import { Badge } from "@/components/ui/badge"
import { getRoleColor } from "@/lib/utils/permissions"
import { cn } from "@/lib/utils"

interface RoleBadgeProps {
  role: string
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge variant="outline" className={cn(getRoleColor(role), "font-medium", className)}>
      {role.replace(/_/g, " ")}
    </Badge>
  )
}
