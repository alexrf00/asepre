import type React from "react"
import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-10">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/images/asepre-logo.png" alt="ASEPRE" width={56} height={56} className="object-contain" />
          <div>
            <span className="text-xl font-bold">ASEPRE</span>
            <p className="text-xs text-muted-foreground">Agentes de Seguridad Preventiva</p>
          </div>
        </Link>

        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {'"'}Sistema empresarial de gestión integral. Control de acceso basado en roles, facturación y
              administración de contratos para servicios de seguridad.{'"'}
            </p>
          </blockquote>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="text-2xl font-bold text-primary">256-bit</p>
              <p className="text-sm text-muted-foreground">Encriptación</p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="text-2xl font-bold text-primary">RS256</p>
              <p className="text-sm text-muted-foreground">JWT Algorithm</p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="text-2xl font-bold text-primary">100%</p>
              <p className="text-sm text-muted-foreground">Type-Safe</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Protegido con autenticación de nivel empresarial</p>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">{children}</div>
      </div>
    </div>
  )
}
