"use client"

// ===== Client Form Component =====

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RNCInput } from "@/components/business/common/rnc-input"
import { createClientSchema, type CreateClientFormData } from "@/lib/validations/business"
import { getLegalTypes } from "@/lib/api/business/clients"
import type { Client, LegalType } from "@/lib/types/business"

interface ClientFormProps {
  client?: Client | null
  onSubmit: (data: CreateClientFormData) => Promise<void>
  isLoading?: boolean
}

export function ClientForm({ client, onSubmit, isLoading = false }: ClientFormProps) {
  const [legalTypes, setLegalTypes] = useState<LegalType[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)

  const form = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: client?.name || "",
      legalName: client?.legalName || "",
      legalTypeId: client?.legalTypeId || "",
      rnc: client?.rnc || "",
      primaryEmail: client?.primaryEmail || "",
      secondaryEmail: client?.secondaryEmail || "",
      primaryPhone: client?.primaryPhone || "",
      secondaryPhone: client?.secondaryPhone || "",
      contactPerson: client?.contactPerson || "",
      billingAddressLine1: client?.billingAddressLine1 || "",
      billingAddressLine2: client?.billingAddressLine2 || "",
      billingCity: client?.billingCity || "",
      billingProvince: client?.billingProvince || "",
      billingPostalCode: client?.billingPostalCode || "",
      serviceAddressLine1: client?.serviceAddressLine1 || "",
      serviceAddressLine2: client?.serviceAddressLine2 || "",
      serviceCity: client?.serviceCity || "",
      serviceProvince: client?.serviceProvince || "",
      servicePostalCode: client?.servicePostalCode || "",
      notes: client?.notes || "",
    },
  })

  useEffect(() => {
    async function loadLegalTypes() {
      try {
        const types = await getLegalTypes()
        setLegalTypes(types)
      } catch (error) {
        console.error("Failed to load legal types:", error)
      } finally {
        setIsLoadingTypes(false)
      }
    }
    loadLegalTypes()
  }, [])

  const selectedLegalType = legalTypes.find((lt) => lt.id === form.watch("legalTypeId"))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            <TabsTrigger value="address">Direcciones</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre comercial *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón social</FormLabel>
                    <FormControl>
                      <Input placeholder="Razón social legal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="legalTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo legal *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingTypes}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {legalTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rnc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RNC {selectedLegalType?.requiresRnc && "*"}</FormLabel>
                    <FormControl>
                      <RNCInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionales sobre el cliente..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persona de contacto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del contacto principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="primaryEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email principal</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondaryEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email secundario</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email2@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="primaryPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono principal</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="809-000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondaryPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono secundario</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="809-000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Address Tab */}
          <TabsContent value="address" className="space-y-6 pt-4">
            {/* Billing Address */}
            <div className="space-y-4">
              <h4 className="font-medium">Dirección de facturación</h4>
              <FormField
                control={form.control}
                name="billingAddressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección línea 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Calle, número, edificio..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingAddressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección línea 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Suite, piso, apartamento..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="billingCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Santo Domingo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingProvince"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input placeholder="Distrito Nacional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingPostalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código postal</FormLabel>
                      <FormControl>
                        <Input placeholder="10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Service Address */}
            <div className="space-y-4">
              <h4 className="font-medium">Dirección de servicio</h4>
              <FormField
                control={form.control}
                name="serviceAddressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección línea 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Calle, número, edificio..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceAddressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección línea 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Suite, piso, apartamento..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="serviceCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Santo Domingo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceProvince"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input placeholder="Distrito Nacional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="servicePostalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código postal</FormLabel>
                      <FormControl>
                        <Input placeholder="10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : client ? "Actualizar cliente" : "Crear cliente"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
