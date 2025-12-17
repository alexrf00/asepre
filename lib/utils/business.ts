// ===== Business Module Utility Functions =====

import type { ClientStatus, ContractStatus, InvoiceStatus, PaymentStatus, BillingFrequency } from "@/lib/types/business"

// ===== Currency Formatting (Dominican Peso) =====

/**
 * Format amount as Dominican Peso currency
 */
export function formatDOP(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format amount without currency symbol
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ===== RNC (Dominican Tax ID) Functions =====

/**
 * Validate RNC format (9 or 11 digits)
 */
export function validateRNC(rnc: string): boolean {
  const cleaned = rnc.replace(/[-\s]/g, "")
  return /^[0-9]{9}$|^[0-9]{11}$/.test(cleaned)
}

/**
 * Format RNC for display with dashes
 */
export function formatRNC(rnc: string): string {
  const cleaned = rnc.replace(/[-\s]/g, "")
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 8)}-${cleaned.slice(8)}`
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 10)}-${cleaned.slice(10)}`
  }
  return cleaned
}

/**
 * Clean RNC for API submission
 */
export function cleanRNC(rnc: string): string {
  return rnc.replace(/[-\s]/g, "")
}

// ===== NCF (Fiscal Number) Functions =====

/**
 * Format NCF for display (e.g., B01-00000089)
 */
export function formatNCF(ncf: string): string {
  if (ncf.length === 11) {
    return `${ncf.slice(0, 3)}-${ncf.slice(3)}`
  }
  if (ncf.length === 13) {
    return `${ncf.slice(0, 3)}-${ncf.slice(3, 5)}-${ncf.slice(5)}`
  }
  return ncf
}

// ===== Date Formatting (Dominican Format) =====

/**
 * Format date as DD/MM/YYYY
 */
export function formatDateDO(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

/**
 * Format date for API (ISO)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * Format date with time
 */
export function formatDateTimeDO(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

// ===== Status Color Functions =====

export function getClientStatusColor(status: ClientStatus): string {
  switch (status) {
    case "ACTIVE":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    case "INACTIVE":
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
    case "SUSPENDED":
      return "text-red-500 bg-red-500/10 border-red-500/20"
    default:
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
  }
}

export function getContractStatusColor(status: ContractStatus): string {
  switch (status) {
    case "DRAFT":
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
    case "ACTIVE":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    case "SUSPENDED":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20"
    case "TERMINATED":
      return "text-red-500 bg-red-500/10 border-red-500/20"
    case "EXPIRED":
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
    default:
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
  }
}

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case "DRAFT":
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
    case "ISSUED":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20"
    case "PARTIAL":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20"
    case "PAID":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    case "CANCELLED":
      return "text-red-500 bg-red-500/10 border-red-500/20"
    case "VOID":
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
    default:
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
  }
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case "PENDING":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20"
    case "COMPLETED":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    case "FAILED":
      return "text-red-500 bg-red-500/10 border-red-500/20"
    case "REFUNDED":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20"
    default:
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
  }
}

// ===== Status Label Functions =====

export function getClientStatusLabel(status: ClientStatus): string {
  const labels: Record<ClientStatus, string> = {
    ACTIVE: "Activo",
    INACTIVE: "Inactivo",
    SUSPENDED: "Suspendido",
  }
  return labels[status] || status
}

export function getContractStatusLabel(status: ContractStatus): string {
  const labels: Record<ContractStatus, string> = {
    DRAFT: "Borrador",
    ACTIVE: "Activo",
    SUSPENDED: "Suspendido",
    TERMINATED: "Terminado",
    EXPIRED: "Vencido",
  }
  return labels[status] || status
}

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    DRAFT: "Borrador",
    ISSUED: "Emitida",
    PARTIAL: "Pago Parcial",
    PAID: "Pagada",
    CANCELLED: "Cancelada",
    VOID: "Anulada",
  }
  return labels[status] || status
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    PENDING: "Pendiente",
    COMPLETED: "Completado",
    FAILED: "Fallido",
    REFUNDED: "Reembolsado",
  }
  return labels[status] || status
}

export function getBillingFrequencyLabel(frequency: BillingFrequency): string {
  const labels: Record<BillingFrequency, string> = {
    WEEKLY: "Semanal",
    BIWEEKLY: "Quincenal",
    MONTHLY: "Mensual",
    QUARTERLY: "Trimestral",
    ANNUALLY: "Anual",
    ONE_TIME: "Una vez",
  }
  return labels[frequency] || frequency
}

// ===== Calculation Helpers =====

/**
 * Calculate ITBIS (Dominican VAT) - default 18%
 */
export function calculateITBIS(amount: number, rate = 0.18): number {
  return amount * rate
}

/**
 * Calculate line total with optional ITBIS
 */
export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  itbisApplicable: boolean,
  itbisRate = 0.18,
): { subtotal: number; itbis: number; total: number } {
  const subtotal = quantity * unitPrice
  const itbis = itbisApplicable ? calculateITBIS(subtotal, itbisRate) : 0
  return {
    subtotal,
    itbis,
    total: subtotal + itbis,
  }
}

// ===== Validation Helpers =====

/**
 * Check if invoice is editable
 */
export function isInvoiceEditable(status: InvoiceStatus): boolean {
  return status === "DRAFT"
}

/**
 * Check if contract is editable
 */
export function isContractEditable(status: ContractStatus): boolean {
  return status === "DRAFT"
}

/**
 * Check if invoice can receive payment
 */
export function canReceivePayment(status: InvoiceStatus): boolean {
  return status === "ISSUED" || status === "PARTIAL"
}
