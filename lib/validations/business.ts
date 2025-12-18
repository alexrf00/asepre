// ===== Business Module Zod Validations =====

import { z } from "zod"

const rncRegex = /^[0-9]{9}$|^[0-9]{11}$/

// ===== Client Validations =====

export const createClientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  legalName: z.string().max(200).optional(),
  legalTypeId: z.string().uuid("Seleccione un tipo legal"),
  rnc: z
    .string()
    .optional()
    .refine((val) => !val || rncRegex.test(val.replace(/[-\s]/g, "")), "El RNC debe tener 9 u 11 dígitos"),
  primaryEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  secondaryEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  primaryPhone: z.string().max(30).optional(),
  secondaryPhone: z.string().max(30).optional(),
  contactPerson: z.string().max(200).optional(),
  billingAddressLine1: z.string().max(255).optional(),
  billingAddressLine2: z.string().max(255).optional(),
  billingCity: z.string().max(100).optional(),
  billingProvince: z.string().max(100).optional(),
  billingPostalCode: z.string().max(20).optional(),
  serviceAddressLine1: z.string().max(255).optional(),
  serviceAddressLine2: z.string().max(255).optional(),
  serviceCity: z.string().max(100).optional(),
  serviceProvince: z.string().max(100).optional(),
  servicePostalCode: z.string().max(20).optional(),
  notes: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
})

// ===== Service Validations =====

export const createServiceSchema = z.object({
  code: z
    .string()
    .min(1, "El código es requerido")
    .max(30)
    .regex(/^[A-Z0-9-]+$/, "Use letras mayúsculas, números y guiones"),
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional(),
  billingUnitId: z.string().uuid("Seleccione una unidad de facturación"),
  itbisApplicable: z.boolean().default(true),
})

export const updateServiceSchema = createServiceSchema.partial().extend({
  active: z.boolean().optional(),
})

// ===== Pricing Validations =====

export const setGlobalPriceSchema = z.object({
  serviceId: z.string().uuid("Seleccione un servicio"),
  price: z.number().min(0, "El precio debe ser positivo"),
  effectiveFrom: z.string().min(1, "La fecha de vigencia es requerida"),
})

export const setClientPriceSchema = z.object({
  clientId: z.string().uuid("Seleccione un cliente"),
  serviceId: z.string().uuid("Seleccione un servicio"),
  price: z.number().min(0, "El precio debe ser positivo"),
  effectiveFrom: z.string().min(1, "La fecha de vigencia es requerida"),
})

// ===== Contract Validations =====

export const createContractLineSchema = z.object({
  serviceId: z.string().min(1, "Seleccione un servicio"),
  quantity: z.number().min(0.01, "Cantidad inválida"),
  billingUnitId: z.string().uuid().optional(),
  manualUnitPrice: z.number().min(0),
  itbisApplicable: z.boolean(), // <-- REQUIRED (fixes resolver typing)
  scheduleNotes: z.string().max(500).optional(),
})

export const createContractSchema = z.object({
  clientId: z.string().uuid("Seleccione un cliente"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  billingFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"]),
  billingDayOfMonth: z.number().min(1).max(28).optional(),
  lines: z.array(createContractLineSchema).min(1, "Se requiere al menos una línea de servicio"),
})

export const updateContractSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  billingFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"]).optional(),
  billingDayOfMonth: z.number().min(1).max(28).optional(),
})

// ===== Invoice Validations =====

export const createInvoiceLineSchema = z.object({
  serviceId: z.string().uuid().optional(),
  contractLineId: z.string().uuid().optional(),
  description: z.string().min(1, "La descripción es requerida"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  billingUnitId: z.string().uuid().optional(),
  unitPrice: z.number().min(0, "El precio debe ser positivo"),
  itbisApplicable: z.boolean(),
})

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid("Seleccione un cliente"),
  contractId: z.string().uuid().optional(),
  issueDate: z.string().min(1, "La fecha de emisión es requerida"),
  dueDate: z.string().min(1, "La fecha de vencimiento es requerida"),
  notes: z.string().optional(),
  lines: z.array(createInvoiceLineSchema).min(1, "Se requiere al menos una línea"),
})

export const cancelInvoiceSchema = z.object({
  reason: z.string().min(1, "El motivo de cancelación es requerido"),
})

// ===== Payment Validations =====

export const paymentAllocationSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
})

export const recordPaymentSchema = z.object({
  clientId: z.string().uuid("Seleccione un cliente"),
  paymentTypeId: z.string().uuid("Seleccione un tipo de pago"),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  paymentDate: z.string().min(1, "La fecha de pago es requerida"),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
  allocations: z.array(paymentAllocationSchema).optional(),
  generateReceipt: z.boolean().default(true),
})

export const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  paymentDate: z.string().min(1, "La fecha de pago es requerida"),
  paymentMethod: z.enum(["transfer", "check", "cash", "card"]),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
})

export const createPaymentTypeSchema = z.object({
  code: z
    .string()
    .min(1, "El código es requerido")
    .max(20)
    .regex(/^[A-Z0-9-]+$/, "Use letras mayúsculas, números y guiones"),
  name: z.string().min(1, "El nombre es requerido").max(50),
  description: z.string().max(200).optional(),
  requiresReference: z.boolean().default(false),
})

// ===== Receipt Validations =====

export const voidReceiptSchema = z.object({
  reason: z.string().min(1, "El motivo de anulación es requerido"),
})

// ===== Type Exports =====

export type CreateClientFormData = z.infer<typeof createClientSchema>
export type UpdateClientFormData = z.infer<typeof updateClientSchema>
export type CreateServiceFormData = z.infer<typeof createServiceSchema>
export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>
export type SetGlobalPriceFormData = z.infer<typeof setGlobalPriceSchema>
export type SetClientPriceFormData = z.infer<typeof setClientPriceSchema>
export type CreateContractFormData = z.infer<typeof createContractSchema>
export type CreateContractLineFormData = z.infer<typeof createContractLineSchema>
export type UpdateContractFormData = z.infer<typeof updateContractSchema>
export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>
export type CreateInvoiceLineFormData = z.infer<typeof createInvoiceLineSchema>
export type CancelInvoiceFormData = z.infer<typeof cancelInvoiceSchema>
export type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
export type CreatePaymentTypeFormData = z.infer<typeof createPaymentTypeSchema>
export type VoidReceiptFormData = z.infer<typeof voidReceiptSchema>
