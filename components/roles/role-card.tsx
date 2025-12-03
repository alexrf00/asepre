"use client"

import { MoreHorizontal, Edit, Trash2, Users, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { RoleBadge } from "@/components/common/role-badge"
import { PermissionGate } from "@/components/common/permission-gate"
import type { Role } from "@/types"
import { formatRelativeTime } from "@/lib/utils/formatters"

interface RoleCardProps {
  role: Role
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
  onViewUsers: (role: Role) => void
}

export function RoleCard({ role, onEdit, onDelete, onViewUsers }: RoleCardProps) {
  return (
    <Card className="relative">
      {role.isSystem && (
        <div className="absolute top-3 right-12">
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            System
          </Badge>
        </div>
      )}

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <RoleBadge role={role.name} />
          </CardTitle>
          <CardDescription className="text-xs">Level {role.level}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewUsers(role)}>
              <Users className="mr-2 h-4 w-4" />
              View Users
            </DropdownMenuItem>
            {!role.isSystem && (
              <>
                <PermissionGate permissions={["AUTH_ROLE_UPDATE"]} roles={["SUPERADMIN"]}>
                  <DropdownMenuItem onClick={() => onEdit(role)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Role
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <PermissionGate permissions={["AUTH_ROLE_DELETE"]} roles={["SUPERADMIN"]}>
                  <DropdownMenuItem onClick={() => onDelete(role)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Role
                  </DropdownMenuItem>
                </PermissionGate>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{role.description}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Permissions</span>
            <span className="font-medium">{role.permissions.length}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {role.permissions.slice(0, 3).map((permission) => (
              <Badge key={permission} variant="outline" className="text-xs">
                {permission}
              </Badge>
            ))}
            {role.permissions.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{role.permissions.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">Updated {formatRelativeTime(role.updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
