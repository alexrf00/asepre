import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials, formatRelativeTime } from "@/lib/utils/formatters"
import { RoleBadge } from "@/components/common/role-badge"

interface ActivityItemProps {
  user: {
    firstName: string
    lastName: string
  }
  action: string
  target?: string
  role?: string
  timestamp: string
}

export function ActivityItem({ user, action, target, role, timestamp }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {getInitials(user.firstName, user.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-medium">
            {user.firstName} {user.lastName}
          </span>{" "}
          {action}
          {target && <span className="font-medium"> {target}</span>}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{formatRelativeTime(timestamp)}</p>
          {role && <RoleBadge role={role} className="text-[10px]" />}
        </div>
      </div>
    </div>
  )
}
