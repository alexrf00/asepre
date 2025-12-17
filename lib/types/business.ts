// ===== Business Module Types for ASEPRE Private Security Services =====

// Status Enums
export type ClientStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"
export type ContractStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "TERMINATED" | "EXPIRED"
export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "CANCELLED" | "VOID"
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
export type PriceSource = "GLOBAL" | "CLIENT" | "MANUAL"
export type BillingFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "ONE_TIME"
export type ReceiptStatus = "ACTIVE" | "VOID"

// ===== Reference Types =====

export interface LegalType {
  id: string
  code: string
  name: string
  description?: string
  requiresRnc: boolean
  active: boolean
}

export interface BillingUnit {
  id: string
  code: string
  name: string
  description?: string
  active: boolean
}

// ===== Client Types =====

export interface Client {
  id: string
  name: string
  legalName?: string
  legalTypeId: string
  legalTypeCode: string
  legalTypeName: string
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
  billingCountry: string
  serviceAddressLine1?: string
  serviceAddressLine2?: string
  serviceCity?: string
  serviceProvince?: string
  servicePostalCode?: string
  serviceCountry?: string
  status: ClientStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

// ===== Service Types =====

export interface ServiceCatalog {
  id: string
  code: string
  name: string
  description?: string
  billingUnitId: string
  billingUnitCode: string
  billingUnitName: string
  itbisApplicable: boolean
  active: boolean
  createdAt: string
}

// ===== Pricing Types =====

export interface GlobalServicePrice {
  id: string
  serviceId: string
  serviceCode: string
  serviceName: string
  price: number
  currency: string
  effectiveFrom: string
  effectiveTo?: string
  active: boolean
  createdAt: string
}

export interface ClientServicePrice {
  id: string
  clientId: string
  clientName: string
  serviceId: string
  serviceCode: string
  serviceName: string
  price: number
  currency: string
  effectiveFrom: string
  effectiveTo?: string
  active: boolean
  createdAt: string
}

export interface ResolvedPrice {
  price: number
  currency: string
  source: PriceSource
  sourceId: string
  serviceId: string
  clientId: string
}

// ===== Contract Types =====

export interface Contract {
  id: string
  contractNumber: string
  clientId: string
  clientName: string
  startDate: string
  endDate?: string
  status: ContractStatus
  terms?: string
  notes?: string
  billingFrequency: BillingFrequency
  billingDayOfMonth?: number
  lines: ContractLine[]
  createdAt: string
  updatedAt: string
}

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
  priceSource: PriceSource
  priceSourceId?: string
  itbisApplicable: boolean
  scheduleNotes?: string
  active: boolean
  lineTotal: number
}

// ===== Invoice Types =====

export interface Invoice {
  id: string
  invoiceNumber: string
  ncf?: string
  clientId: string
  clientName: string
  clientRnc?: string
  contractId?: string
  contractNumber?: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  currency: string
  subtotal: number
  itbisRate: number
  itbisAmount: number
  total: number
  amountPaid: number
  balance: number
  notes?: string
  lines: InvoiceLine[]
  createdAt: string
  cancelledAt?: string
  cancellationReason?: string
  client: any
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceDue: number
  items: any[]
}

export interface InvoiceLine {
  id: string
  serviceId?: string
  serviceCode?: string
  serviceName?: string
  contractLineId?: string
  description: string
  quantity: number
  billingUnitId?: string
  billingUnitCode?: string
  unitPrice: number
  lineSubtotal: number
  itbisApplicable: boolean
  itbisAmount: number
  lineTotal: number
  lineOrder: number
}

// ===== Payment Types =====

export interface PaymentType {
  id: string
  code: string
  name: string
  description?: string
  requiresReference: boolean
  active: boolean
}

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

export interface PaymentAllocation {
  id: string
  paymentId: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  createdAt: string
}

export interface Receipt {
  id: string
  receiptNumber: string
  paymentId: string
  paymentNumber: string
  clientId: string
  clientName: string
  amount: number
  currency: string
  receiptDate: string
  status: ReceiptStatus
  voidedAt?: string
  voidReason?: string
}

// ===== Dashboard Types =====

export interface BusinessDashboardStats {
  totalClients: number
  activeClients: number
  activeContracts: number
  pendingInvoices: number
  overdueInvoices: number
  monthlyRevenue: number
  totalReceivables: number
}

export interface RevenueDataPoint {
  month: string
  revenue: number
}

// ===== Request Types =====

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

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  status?: ClientStatus
}

export interface CreateServiceRequest {
  code: string
  name: string
  description?: string
  billingUnitId: string
  itbisApplicable: boolean
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {
  active?: boolean
}

export interface SetGlobalPriceRequest {
  serviceId: string
  price: number
  effectiveFrom: string
}

export interface SetClientPriceRequest {
  clientId: string
  serviceId: string
  price: number
  effectiveFrom: string
}

export interface CreateContractRequest {
  clientId: string
  startDate: string
  endDate?: string
  terms?: string
  notes?: string
  billingFrequency: BillingFrequency
  billingDayOfMonth?: number
  lines: CreateContractLineRequest[]
}

export interface CreateContractLineRequest {
  serviceId: string
  quantity: number
  billingUnitId?: string
  manualUnitPrice?: number
  itbisApplicable?: boolean
  scheduleNotes?: string
}

export interface UpdateContractRequest {
  startDate?: string
  endDate?: string
  terms?: string
  notes?: string
  billingFrequency?: BillingFrequency
  billingDayOfMonth?: number
}

export interface CreateInvoiceRequest {
  clientId: string
  contractId?: string
  issueDate: string
  dueDate: string
  notes?: string
  lines: CreateInvoiceLineRequest[]
}

export interface CreateInvoiceLineRequest {
  serviceId?: string
  contractLineId?: string
  description: string
  quantity: number
  billingUnitId?: string
  unitPrice: number
  itbisApplicable: boolean
}

export interface RecordPaymentRequest {
  clientId: string
  paymentTypeId: string
  amount: number
  paymentDate: string
  reference?: string
  notes?: string
  allocations?: PaymentAllocationRequest[]
  generateReceipt?: boolean
}

export interface PaymentAllocationRequest {
  invoiceId: string
  amount: number
}

export interface CreatePaymentTypeRequest {
  code: string
  name: string
  description?: string
  requiresReference: boolean
}

export interface CancelInvoiceRequest {
  reason: string
}

export interface VoidReceiptRequest {
  reason: string
}

// ===== Response Types =====

export interface BusinessPaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface BusinessApiResponse<T> {
  success: boolean
  message: string
  data?: T
}
