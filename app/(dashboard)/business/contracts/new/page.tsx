"use client"

import { useRouter } from "next/navigation"
import { PermissionGate } from "@/components/common/permission-gate"
import { ContractWizard } from "@/components/business/contracts/contract-wizard"
import { contractsApi } from "@/lib/api/business/contracts"
import type { ContractFormData } from "@/lib/validations/business"
import { toast } from "sonner"
import { useState } from "react"

export default function NewContractPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: ContractFormData) => {
    setIsLoading(true)
    try {
      const contract = await contractsApi.create(data)
      toast.success("Contrato creado exitosamente")
      router.push(`/business/contracts/${contract.id}`)
    } catch {
      toast.error("Error al crear el contrato")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PermissionGate permissions={["contracts.create"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Contrato</h1>
          <p className="text-muted-foreground">Complete los pasos para crear un nuevo contrato de servicios</p>
        </div>

        <ContractWizard
          onSubmit={handleSubmit}
          onCancel={() => router.push("/business/contracts")}
          isLoading={isLoading}
        />
      </div>
    </PermissionGate>
  )
}
