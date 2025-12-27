"use client"

import type React from "react"

import { Mail, Phone, MapPin, Building, FileText, Calendar, User } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientStatusBadge } from "./client-status-badge"
import { ClientSubscriptionsCard } from "../subscriptions/client-subscriptions-card"
import { formatDateTime } from "@/lib/utils/formatters"
import type { Client } from "@/types/business"

interface ClientDetailSheetProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ElementType
  label: string
  value?: string | null
}) {
  if (!value) return null

  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm break-words">{value}</p>
      </div>
    </div>
  )
}

function AddressBlock({
  title,
  address,
}: {
  title: string
  address: { line1?: string; line2?: string; city?: string; province?: string; postalCode?: string }
}) {
  const hasAddress = address.line1 || address.city || address.province

  if (!hasAddress) return null

  return (
    <div className="flex items-start gap-3">
      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <div className="text-sm">
          {address.line1 && <p>{address.line1}</p>}
          {address.line2 && <p>{address.line2}</p>}
          {(address.city || address.province) && (
            <p>
              {address.city}
              {address.city && address.province && ", "}
              {address.province}
              {address.postalCode && ` ${address.postalCode}`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ClientDetailSheet({ client, open, onOpenChange }: ClientDetailSheetProps) {
  if (!client) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{client.name}</SheetTitle>
              <SheetDescription>
                {client.legalName && client.legalName !== client.name ? client.legalName : "Client Details"}
              </SheetDescription>
            </div>
            <ClientStatusBadge status={client.status} />
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            {/* Basic Info */}
            <DetailSection title="Basic Information">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{client.legalTypeName}</Badge>
                  <Badge variant="outline">{client.legalTypeCode}</Badge>
                </div>
                {client.rnc && <DetailRow icon={Building} label="RNC (Tax ID)" value={client.rnc} />}
              </div>
            </DetailSection>

            <Separator />

            {/* Contact Info */}
            <DetailSection title="Contact Information">
              <div className="space-y-3">
                {client.contactPerson && <DetailRow icon={User} label="Contact Person" value={client.contactPerson} />}
                <DetailRow icon={Mail} label="Primary Email" value={client.primaryEmail} />
                <DetailRow icon={Mail} label="Secondary Email" value={client.secondaryEmail} />
                <DetailRow icon={Phone} label="Primary Phone" value={client.primaryPhone} />
                <DetailRow icon={Phone} label="Secondary Phone" value={client.secondaryPhone} />
              </div>
            </DetailSection>

            <Separator />

            {/* Addresses */}
            <DetailSection title="Addresses">
              <div className="space-y-4">
                <AddressBlock
                  title="Billing Address"
                  address={{
                    line1: client.billingAddressLine1,
                    line2: client.billingAddressLine2,
                    city: client.billingCity,
                    province: client.billingProvince,
                    postalCode: client.billingPostalCode,
                  }}
                />
                <AddressBlock
                  title="Service Address"
                  address={{
                    line1: client.serviceAddressLine1,
                    line2: client.serviceAddressLine2,
                    city: client.serviceCity,
                    province: client.serviceProvince,
                    postalCode: client.servicePostalCode,
                  }}
                />
              </div>
            </DetailSection>

            {client.notes && (
              <>
                <Separator />
                <DetailSection title="Notes">
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                  </div>
                </DetailSection>
              </>
            )}

            <Separator />

            {/* Timestamps */}
            <DetailSection title="Record Info">
              <div className="space-y-3">
                <DetailRow icon={Calendar} label="Created" value={formatDateTime(client.createdAt)} />
                <DetailRow icon={Calendar} label="Last Updated" value={formatDateTime(client.updatedAt)} />
              </div>
            </DetailSection>
          </TabsContent>

          <TabsContent value="services" className="mt-4">
            <ClientSubscriptionsCard 
              clientId={client.id} 
              clientName={client.name} 
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}