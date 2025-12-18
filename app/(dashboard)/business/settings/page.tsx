"use client"

// ===== Business Settings Page =====

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Save, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { PermissionGate } from "@/components/common/permission-gate"
import { Loader2 } from "lucide-react"

interface BusinessSettings {
  // Tax settings
  itbisRate: number
  itbisLastUpdated?: string
  // NCF settings
  ncfSeries: string
  ncfTypeCode: string
  ncfCurrentSequence: number
  ncfMaxSequence: number
  // Company info
  companyName: string
  companyRnc: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
}

// Mock data - replace with actual API calls
const mockSettings: BusinessSettings = {
  itbisRate: 18,
  itbisLastUpdated: "2024-01-01",
  ncfSeries: "B",
  ncfTypeCode: "01",
  ncfCurrentSequence: 89,
  ncfMaxSequence: 99999999,
  companyName: "ASEPRE SRL",
  companyRnc: "123456789",
  companyAddress: "Santo Domingo, República Dominicana",
  companyPhone: "809-555-1234",
  companyEmail: "info@asepre.com.do",
}

export default function BusinessSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("tax")

  // Form state
  const [itbisRate, setItbisRate] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyRnc, setCompanyRnc] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // const data = await getBusinessSettings()
      await new Promise((resolve) => setTimeout(resolve, 500))
      const data = mockSettings

      setSettings(data)
      setItbisRate(data.itbisRate.toString())
      setCompanyName(data.companyName)
      setCompanyRnc(data.companyRnc)
      setCompanyAddress(data.companyAddress || "")
      setCompanyPhone(data.companyPhone || "")
      setCompanyEmail(data.companyEmail || "")
    } catch {
      toast.error("Error al cargar configuración")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  async function handleSaveTax() {
    const rate = Number.parseFloat(itbisRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Tasa de ITBIS inválida")
      return
    }

    setIsSaving(true)
    try {
      // TODO: Replace with actual API call
      // await updateBusinessSettings({ itbisRate: rate })
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success("Configuración de impuestos actualizada")
      loadSettings()
    } catch {
      toast.error("Error al guardar configuración")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveCompany() {
    if (!companyName || !companyRnc) {
      toast.error("Nombre y RNC de la empresa son requeridos")
      return
    }

    setIsSaving(true)
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success("Información de empresa actualizada")
      loadSettings()
    } catch {
      toast.error("Error al guardar configuración")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
<PermissionGate permissions={["business.settings.view"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración del Negocio</h1>
            <p className="text-muted-foreground">Configure parámetros del sistema de facturación</p>
          </div>
          <Button variant="outline" size="icon" onClick={loadSettings}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="tax">Impuestos</TabsTrigger>
            <TabsTrigger value="fiscal">Números Fiscales</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
          </TabsList>

          {/* Tax Settings Tab */}
          <TabsContent value="tax" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de ITBIS</CardTitle>
                <CardDescription>Tasa de impuesto aplicada a servicios gravables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="itbisRate">Tasa de ITBIS (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="itbisRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={itbisRate}
                        onChange={(e) => setItbisRate(e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    {settings?.itbisLastUpdated && (
                      <p className="text-sm text-muted-foreground">Última actualización: {settings.itbisLastUpdated}</p>
                    )}
                  </div>
                </div>
                <Button onClick={handleSaveTax} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Actualizar Tasa
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fiscal Numbers Tab */}
          <TabsContent value="fiscal" className="space-y-4">
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                Los cambios en la configuración de NCF requieren autorización de la DGII. Modifique estos valores solo
                si tiene la documentación correspondiente.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de NCF</CardTitle>
                <CardDescription>Números de Comprobante Fiscal para facturación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Serie</Label>
                    <Input value={settings?.ncfSeries || ""} disabled className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label>Código de Tipo</Label>
                    <Input value={settings?.ncfTypeCode || ""} disabled className="font-mono" />
                    <p className="text-xs text-muted-foreground">01 = Crédito Fiscal</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Secuencia Actual</Label>
                    <Input value={settings?.ncfCurrentSequence?.toString() || ""} disabled className="font-mono" />
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Próximo NCF</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {settings?.ncfSeries}
                        {settings?.ncfTypeCode}
                        {String((settings?.ncfCurrentSequence || 0) + 1).padStart(8, "0")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Disponibles</p>
                      <p className="text-lg font-medium">
                        {((settings?.ncfMaxSequence || 0) - (settings?.ncfCurrentSequence || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Para modificar la secuencia de NCF, contacte al administrador del sistema con la documentación de la
                  DGII.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Info Tab */}
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
                <CardDescription>Datos que aparecen en facturas y recibos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="ASEPRE SRL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyRnc">RNC de la Empresa *</Label>
                    <Input
                      id="companyRnc"
                      value={companyRnc}
                      onChange={(e) => setCompanyRnc(e.target.value)}
                      placeholder="123456789"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Dirección</Label>
                  <Input
                    id="companyAddress"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Calle Principal #123, Santo Domingo"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Teléfono</Label>
                    <Input
                      id="companyPhone"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="809-555-1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="info@empresa.com.do"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveCompany} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Información
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
</PermissionGate>
  )
}
