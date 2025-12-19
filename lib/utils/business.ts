import type { ClientStatus, ContractStatus, InvoiceStatus, PaymentStatus, ReceiptStatus } from "@/types/business"

/**
 * Formats RNC (Registro Nacional de Contribuyente) as XXX-XXXXXXX-X
 */
export function formatRNC(rnc: string): string {
  if (!rnc) return ""
  const cleaned = rnc.replace(/\D/g, "")
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 10)}-${cleaned.slice(10)}`
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 10)}-${cleaned.slice(10)}`
  }
  return rnc
}

/**
 * Checks if an invoice is overdue based on due date and status
 */
export function isOverdue(dueDate: string, status: string): boolean {
  if (!["ISSUED", "PARTIAL"].includes(status)) return false
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

type StatusType = "client" | "contract" | "invoice" | "payment" | "receipt"
type StatusValue = ClientStatus | ContractStatus | InvoiceStatus | PaymentStatus | ReceiptStatus

const statusColors: Record<StatusType, Record<string, string>> = {
  client: {
    ACTIVE: "text-green-600",
    INACTIVE: "text-gray-500",
    SUSPENDED: "text-red-600",
  },
  contract: {
    DRAFT: "text-gray-500",
    ACTIVE: "text-green-600",
    SUSPENDED: "text-yellow-600",
    TERMINATED: "text-red-600",
  },
  invoice: {
    DRAFT: "text-gray-500",
    ISSUED: "text-blue-600",
    PARTIAL: "text-yellow-600",
    PAID: "text-green-600",
    CANCELLED: "text-gray-500",
    VOID: "text-red-600",
  },
  payment: {
    PENDING: "text-yellow-600",
    ALLOCATED: "text-green-600",
    PARTIAL: "text-blue-600",
  },
  receipt: {
    ACTIVE: "text-green-600",
    VOID: "text-red-600",
  },
}

/**
 * Gets the appropriate color class for a status
 */
export function getStatusColor(status: StatusValue, type: StatusType): string {
  return statusColors[type]?.[status] ?? "text-gray-500"
}

/**
 * Parses NCF (Número de Comprobante Fiscal) into its components
 * Format: B01XXXXXXXX (type prefix + sequence)
 */
export function parseNCF(ncf: string): { type: string; sequence: string } {
  if (!ncf || ncf.length < 3) {
    return { type: "", sequence: "" }
  }
  const type = ncf.slice(0, 3) // e.g., "B01"
  const sequence = ncf.slice(3)
  return { type, sequence }
}

/**
 * NCF type descriptions
 */
export const NCF_TYPES: Record<string, string> = {
  B01: "Factura de Crédito Fiscal",
  B02: "Factura de Consumo",
  B03: "Nota de Débito",
  B04: "Nota de Crédito",
  B11: "Comprobante de Compras",
  B12: "Registro Único de Ingresos",
  B13: "Gastos Menores",
  B14: "Regímenes Especiales",
  B15: "Gubernamental",
  B16: "Exportaciones",
}

/**
 * Gets NCF type description
 */
export function getNCFTypeDescription(ncf: string): string {
  const { type } = parseNCF(ncf)
  return NCF_TYPES[type] ?? "Unknown"
}

/**
 * Calculates days until due or days overdue
 */
export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
