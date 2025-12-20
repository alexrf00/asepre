import useSWR from "swr"
import { getInvoiceStats } from "@/lib/api/invoices"
import { getPendingApprovalUsers } from "@/lib/api/admin"

interface NavBadges {
  overdueInvoices: number
  pendingApprovals: number
  isLoading: boolean
}

async function fetchNavBadges(): Promise<{ overdueInvoices: number; pendingApprovals: number }> {
  const [invoiceStatsResponse, pendingApprovalsResponse] = await Promise.allSettled([
    getInvoiceStats(),
    getPendingApprovalUsers(0, 1), // Only need totalElements, so fetch 1 item
  ])

  const overdueInvoices =
    invoiceStatsResponse.status === "fulfilled" && invoiceStatsResponse.value.data
      ? invoiceStatsResponse.value.data.overdue
      : 0

  const pendingApprovals =
    pendingApprovalsResponse.status === "fulfilled" && pendingApprovalsResponse.value
      ? pendingApprovalsResponse.value.totalElements
      : 0

  return { overdueInvoices, pendingApprovals }
}

export function useNavBadges(): NavBadges {
  const { data, isLoading } = useSWR("nav-badges", fetchNavBadges, {
    refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60 * 1000, // Dedupe requests within 1 minute
  })

  return {
    overdueInvoices: data?.overdueInvoices ?? 0,
    pendingApprovals: data?.pendingApprovals ?? 0,
    isLoading,
  }
}
