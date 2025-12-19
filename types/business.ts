// ===== CLIENT TYPES =====

/** Status of a client account */
export type ClientStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

/** Legal entity type classification */
export interface LegalType {
  id: string
  code: string
  name: string
  description: string
  /** Whether this legal type requires RNC (tax ID) */
  requiresRnc: boolean
  active: boolean
}

/** Client entity with full details */
export interface Client {
  id: string
  name: string
  legalName: string
  legalTypeCode: string
  legalTypeName: string
  /** RNC (Registro Nacional de Contribuyente) - Dominican tax ID */
  rnc: string
  primaryEmail: string
  secondaryEmail: string
  primaryPhone: string
  secondaryPhone: string
  contactPerson: string
  billingAddressLine1: string
  billingAddressLine2: string
  billingCity: string
  billingProvince: string
  billingPostalCode: string
  billingCountry: string
  serviceAddressLine1: string
  serviceAddressLine2: string
  serviceCity: string
  serviceProvince: string
  servicePostalCode: string
  status: ClientStatus
  notes: string
  createdAt: string
  updatedAt: string
}

/** Request payload for creating a new client */
export interface CreateClientRequest {
  name: string
  legalName?: string
  legalTypeId: string
  rnc?: string
  primaryEmail?: string
  secondaryEmail?: string
  primaryPhone?: string
  secondaryPhone?: string
  contactPerson?: string
  billingAddressLine1?: string
  billingAddressLine2?: string
  billingCity?: string
  billingProvince?: string
  billingPostalCode?: string
  serviceAddressLine1?: string
  serviceAddressLine2?: string
  serviceCity?: string
  serviceProvince?: string
  servicePostalCode?: string
  notes?: string
}

/** Request payload for updating an existing client */
export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  status?: ClientStatus
}

/** Aggregated statistics for clients */
export interface ClientStats {
  totalClients: number
  activeClients: number
  inactiveClients: number
  suspendedClients: number
}

// ===== SERVICE CATALOG TYPES =====

/** Unit of measurement for billing purposes */
export interface BillingUnit {
  id: string
  code: string
  name: string
  description: string
  active: boolean
}

/** Service offering in the catalog */
export interface ServiceCatalog {
  id: string
  code: string
  name: string
  description: string
  billingUnitId: string
  billingUnitCode: string
  billingUnitName: string
  /** Whether ITBIS (Dominican VAT) applies to this service */
  itbisApplicable: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Request payload for creating a new service */
export interface CreateServiceRequest {
  code: string
  name: string
  description?: string
  billingUnitId: string
  itbisApplicable?: boolean
}

/** Request payload for updating an existing service */
export interface UpdateServiceRequest {
  name?: string
  description?: string
  billingUnitId?: string
  itbisApplicable?: boolean
  active?: boolean
}

// ===== PRICING TYPES =====

/** Type of price - global (default) or client-specific */
export type PriceType = "GLOBAL" | "CLIENT"

/** Price record for a service */
export interface Price {
  id: string
  serviceId: string
  serviceCode: string
  serviceName: string
  clientId?: string
  clientName?: string
  price: number
  currency: string
  effectiveFrom: string
  effectiveTo?: string
  /** Version number for price history tracking */
  version: number
  priceType: PriceType
  notes?: string
  createdAt: string
}

/** Request payload for setting a global price */
export interface SetGlobalPriceRequest {
  serviceId: string
  price: number
  effectiveFrom?: string
  notes?: string
}

/** Request payload for setting a client-specific price */
export interface SetClientPriceRequest {
  serviceId: string
  clientId: string
  price: number
  effectiveFrom?: string
  notes?: string
}

/**
 * Resolved price after applying pricing hierarchy
 * (client-specific price takes precedence over global)
 */
export interface ResolvedPrice {
  price: number
  currency: string
  source: "GLOBAL" | "CLIENT"
  sourceId: string
  serviceId: string
  clientId: string
}

// ===== CONTRACT TYPES =====

/** Status of a contract */
export type ContractStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "TERMINATED"

/** How often billing occurs */
export type BillingFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "ONE_TIME"

/** Unit for billing interval calculation */
export type BillingIntervalUnit = "DAY" | "WEEK" | "MONTH" | "YEAR"

/** Type of agreement */
export type AgreementType = "WRITTEN" | "VERBAL"

/** Type of contract document */
export type ContractDocumentType = "EXECUTED" | "AMENDMENT" | "ADDENDUM" | "ANNEX"

/** Individual line item in a contract */
export interface ContractLine {
  id: string
  serviceId: string
  serviceCode: string
  serviceName: string
  quantity: number
  billingUnitId: string
  billingUnitCode: string
  billingUnitName: string
  unitPrice: number
  currency: string
  /** Source of the price (GLOBAL, CLIENT, or MANUAL) */
  priceSource: string
  itbisApplicable: boolean
  scheduleNotes?: string
  active: boolean
  /** Calculated total: quantity * unitPrice */
  lineTotal: number
}

/** Document attached to a contract */
export interface ContractDocument {
  id: string
  contractId: string
  version: number
  documentType: ContractDocumentType
  fileName: string
  contentType: string
  fileSize: number
  /** SHA-256 hash for document integrity verification */
  sha256: string
  uploadedAt: string
  uploadedBy: string
  notes?: string
  isCurrent: boolean
}

/** Contract entity with full details including lines */
export interface Contract {
  id: string
  contractNumber: string
  clientId: string
  clientName: string
  startDate: string
  endDate: string
  status: ContractStatus
  terms?: string
  notes?: string
  billingFrequency: BillingFrequency
  billingDayOfMonth?: number
  lines: ContractLine[]
  hasCurrentDocument: boolean
  currentDocumentVersion?: number
  currentDocumentType?: ContractDocumentType
  createdAt: string
  updatedAt: string
}

/** Request payload for creating a contract line */
export interface CreateContractLineRequest {
  serviceId: string
  quantity: number
  billingUnitId: string
  /** If provided, overrides the resolved price */
  manualUnitPrice?: number
  itbisApplicable?: boolean
  scheduleNotes?: string
}

/** Request payload for creating a new contract */
export interface CreateContractRequest {
  clientId: string
  startDate: string
  endDate: string
  terms?: string
  notes?: string
  billingFrequency?: BillingFrequency
  billingDayOfMonth?: number
  billingIntervalUnit?: BillingIntervalUnit
  billingIntervalCount?: number
  agreementType?: AgreementType
  autoInvoicingEnabled?: boolean
  lines: CreateContractLineRequest[]
}

/** Request payload for updating an existing contract */
export interface UpdateContractRequest {
  startDate?: string
  endDate?: string
  terms?: string
  notes?: string
  billingFrequency?: BillingFrequency
  billingDayOfMonth?: number
  billingIntervalUnit?: BillingIntervalUnit
  billingIntervalCount?: number
  agreementType?: AgreementType
  autoInvoicingEnabled?: boolean
}

// ===== INVOICE TYPES =====

/** Status of an invoice */
export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "CANCELLED" | "VOID"

/** Individual line item in an invoice */
export interface InvoiceLine {
  id: string
  serviceId: string
  serviceCode: string
  serviceName: string
  contractLineId?: string
  description?: string
  quantity: number
  billingUnitId: string
  billingUnitCode: string
  unitPrice: number
  /** Subtotal before tax: quantity * unitPrice */
  lineSubtotal: number
  itbisApplicable: boolean
  /** ITBIS (tax) amount for this line */
  itbisAmount: number
  /** Total including tax */
  lineTotal: number
  /** Order of the line in the invoice */
  lineOrder: number
}

/** Invoice entity with full details including lines */
export interface Invoice {
  id: string
  invoiceNumber: string
  /** NCF (Número de Comprobante Fiscal) - Dominican fiscal receipt number */
  ncf?: string
  clientId: string
  clientName: string
  clientRnc: string
  contractId?: string
  contractNumber?: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  currency: string
  subtotal: number
  /** ITBIS rate as decimal (e.g., 0.18 for 18%) */
  itbisRate: number
  itbisAmount: number
  total: number
  amountPaid: number
  /** Remaining balance: total - amountPaid */
  balance: number
  notes?: string
  lines: InvoiceLine[]
  createdAt: string
  cancelledAt?: string
  cancellationReason?: string
}

/** Request payload for creating an invoice line */
export interface CreateInvoiceLineRequest {
  serviceId: string
  contractLineId?: string
  description?: string
  quantity: number
  billingUnitId: string
  unitPrice: number
  itbisApplicable?: boolean
}

/** Request payload for creating a new invoice */
export interface CreateInvoiceRequest {
  clientId: string
  contractId?: string
  issueDate: string
  dueDate: string
  notes?: string
  lines: CreateInvoiceLineRequest[]
}

/** Request payload for generating invoice from contract */
export interface GenerateInvoiceFromContractRequest {
  issueDate?: string
  dueDate?: string
  periodDescription?: string
}

/** Aggregated statistics for invoices */
export interface InvoiceStats {
  draft: number
  issued: number
  partial: number
  paid: number
  overdue: number
  totalReceivables: number
}

/** Request payload for running recurring invoicing job */
export interface RunRecurringInvoicingRequest {
  date?: string
  maxCatchUpPerContract?: number
}

/** Response from recurring invoicing job */
export interface RunRecurringInvoicingResponse {
  date: string
  maxCatchUpPerContract: number
  invoicesCreated: number
}

// ===== PAYMENT TYPES =====

/** Status of a payment */
export type PaymentStatus = "PENDING" | "ALLOCATED" | "PARTIAL"

/** Payment method type */
export interface PaymentType {
  id: string
  code: string
  name: string
  description?: string
  /** Whether a reference number is required for this payment type */
  requiresReference: boolean
  active: boolean
}

/** Allocation of payment to an invoice */
export interface PaymentAllocation {
  id: string
  paymentId: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  createdAt: string
}

/** Payment entity with full details including allocations */
export interface Payment {
  id: string
  paymentNumber: string
  clientId: string
  clientName: string
  paymentTypeId: string
  paymentTypeCode: string
  paymentTypeName: string
  amount: number
  currency: string
  amountAllocated: number
  amountUnallocated: number
  paymentDate: string
  reference?: string
  notes?: string
  status: PaymentStatus
  allocations: PaymentAllocation[]
  createdAt: string
}

/** Request for allocating payment to invoice(s) */
export interface AllocationRequest {
  invoiceId: string
  amount: number
}

/** Request payload for recording a new payment */
export interface RecordPaymentRequest {
  clientId: string
  paymentTypeId: string
  amount: number
  paymentDate: string
  reference?: string
  notes?: string
  allocations?: AllocationRequest[]
  generateReceipt?: boolean
}

/** Request payload for allocating existing payment */
export interface AllocatePaymentRequest {
  allocations: AllocationRequest[]
}

/** Request payload for creating a new payment type */
export interface CreatePaymentTypeRequest {
  code: string
  name: string
  description?: string
  requiresReference?: boolean
}

// ===== RECEIPT TYPES =====

/** Status of a receipt */
export type ReceiptStatus = "ACTIVE" | "VOID"

/** Receipt entity */
export interface Receipt {
  id: string
  receiptNumber: string
  paymentId: string
  paymentNumber: string
  clientId: string
  clientName: string
  clientRnc: string
  amount: number
  currency: string
  /** Amount written out in words */
  amountInWords: string
  receiptDate: string
  paymentTypeName: string
  paymentReference?: string
  status: ReceiptStatus
  createdAt: string
  voidedAt?: string
  voidReason?: string
}

// ===== BUSINESS DASHBOARD TYPES =====

/** Aggregated statistics for business dashboard */
export interface BusinessDashboardStats {
  totalClients: number
  activeClients: number
  activeContracts: number
  pendingInvoices: number
  overdueInvoices: number
  monthlyRevenue: number
  totalReceivables: number
  overdueReceivables: number
}

/** Data point for revenue chart */
export interface RevenueDataPoint {
  month: string
  revenue: number
}
