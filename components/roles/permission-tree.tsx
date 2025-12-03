"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { groupPermissionsByModule, formatPermission } from "@/lib/utils/permissions"

interface PermissionTreeProps {
  permissions: string[]
  selectedPermissions: string[]
  onPermissionChange: (permissions: string[]) => void
  disabled?: boolean
}

export function PermissionTree({
  permissions,
  selectedPermissions,
  onPermissionChange,
  disabled = false,
}: PermissionTreeProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const groupedPermissions = groupPermissionsByModule(permissions)

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => (prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]))
  }

  const isModuleFullySelected = (modulePermissions: string[]) => {
    return modulePermissions.every((p) => selectedPermissions.includes(p))
  }

  const isModulePartiallySelected = (modulePermissions: string[]) => {
    const selectedCount = modulePermissions.filter((p) => selectedPermissions.includes(p)).length
    return selectedCount > 0 && selectedCount < modulePermissions.length
  }

  const toggleModulePermissions = (modulePermissions: string[]) => {
    if (disabled) return

    if (isModuleFullySelected(modulePermissions)) {
      // Remove all module permissions
      onPermissionChange(selectedPermissions.filter((p) => !modulePermissions.includes(p)))
    } else {
      // Add all module permissions
      const newPermissions = new Set([...selectedPermissions, ...modulePermissions])
      onPermissionChange(Array.from(newPermissions))
    }
  }

  const togglePermission = (permission: string) => {
    if (disabled) return

    if (selectedPermissions.includes(permission)) {
      onPermissionChange(selectedPermissions.filter((p) => p !== permission))
    } else {
      onPermissionChange([...selectedPermissions, permission])
    }
  }

  return (
    <div className="space-y-1">
      {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
        const isExpanded = expandedModules.includes(module)
        const isFullySelected = isModuleFullySelected(modulePermissions)
        const isPartiallySelected = isModulePartiallySelected(modulePermissions)

        return (
          <div key={module} className="rounded-lg border border-border">
            {/* Module Header */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50",
                isExpanded && "border-b border-border",
              )}
              onClick={() => toggleModule(module)}
            >
              <button type="button" className="p-0.5 hover:bg-muted rounded">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <div
                className="flex items-center gap-2 flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleModulePermissions(modulePermissions)
                }}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center",
                    isFullySelected
                      ? "bg-primary border-primary"
                      : isPartiallySelected
                        ? "bg-primary/50 border-primary"
                        : "border-input",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {isFullySelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  {isPartiallySelected && !isFullySelected && <Minus className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className="font-medium text-sm">{module}</span>
                <span className="text-xs text-muted-foreground">
                  ({modulePermissions.filter((p) => selectedPermissions.includes(p)).length}/{modulePermissions.length})
                </span>
              </div>
            </div>

            {/* Module Permissions */}
            {isExpanded && (
              <div className="px-3 py-2 space-y-2 bg-muted/30">
                {modulePermissions.map((permission) => (
                  <div key={permission} className="flex items-center gap-2 ml-6">
                    <Checkbox
                      id={permission}
                      checked={selectedPermissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                      disabled={disabled}
                    />
                    <label
                      htmlFor={permission}
                      className={cn("text-sm cursor-pointer", disabled && "cursor-not-allowed opacity-50")}
                    >
                      {formatPermission(permission)}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
