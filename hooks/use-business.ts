"use client"

import useSWR from "swr"
import { getActiveClients, getLegalTypes } from "@/lib/api/clients"
import { getActiveServices, getBillingUnits } from "@/lib/api/services"
import { getPaymentTypes } from "@/lib/api/payments"

/**
 * Hook for fetching active clients
 */
export function useClients() {
  const { data, error, isLoading, mutate } = useSWR("active-clients", async () => {
    const response = await getActiveClients()
    if (!response.success) throw new Error(response.error)
    return response.data
  })

  return {
    clients: data ?? [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook for fetching active services
 */
export function useServices() {
  const { data, error, isLoading, mutate } = useSWR("active-services", async () => {
    const response = await getActiveServices()
    if (!response.success) throw new Error(response.error)
    return response.data
  })

  return {
    services: data ?? [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook for fetching billing units
 */
export function useBillingUnits() {
  const { data, error, isLoading, mutate } = useSWR("billing-units", async () => {
    const response = await getBillingUnits()
    if (!response.success) throw new Error(response.error)
    return response.data
  })

  return {
    billingUnits: data ?? [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook for fetching payment types
 */
export function usePaymentTypes(activeOnly = true) {
  const { data, error, isLoading, mutate } = useSWR(["payment-types", activeOnly], async () => {
    const response = await getPaymentTypes(activeOnly)
    if (!response.success) throw new Error(response.error)
    return response.data
  })

  return {
    paymentTypes: data ?? [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook for fetching legal types
 */
export function useLegalTypes() {
  const { data, error, isLoading, mutate } = useSWR("legal-types", async () => {
    const response = await getLegalTypes()
    if (!response.success) throw new Error(response.error)
    return response.data
  })

  return {
    legalTypes: data ?? [],
    isLoading,
    error,
    mutate,
  }
}
