import { z } from "zod"

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be less than 50 characters")
    .regex(/^[A-Z_]+$/, "Role name must be uppercase letters and underscores only"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(255, "Description must be less than 255 characters"),
  level: z.number().min(1).max(100, "Level must be between 1 and 100"),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
})

export const updateRoleSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(255, "Description must be less than 255 characters"),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
})

export type CreateRoleFormData = z.infer<typeof createRoleSchema>
export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>
