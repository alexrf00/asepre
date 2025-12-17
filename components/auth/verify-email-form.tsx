// ===== FILE: components/auth/verify-email-form.tsx =====
// Updated verify email form with pending approval support

"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Mail, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { verifyEmail, resendVerification } from "@/lib/api/auth"
import { FullPageLoader, LoadingSpinner } from "@/components/common/loading-spinner"
import { toast } from "sonner"
import type { AccountStatus } from "@/types"

export function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isVerifying, setIsVerifying] = useState(!!token)
  const [verificationStatus, setVerificationStatus] = useState<"success" | "pending_approval" | "error" | null>(null)
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    const verify = async () => {
      if (!token) return

      try {
        const response = await verifyEmail(token)
        
        if (response.success) {
          setAccountStatus(response.accountStatus || null)
          
          // Check account status to determine which message to show
          if (response.accountStatus === "ACTIVE") {
            setVerificationStatus("success")
          } else if (response.accountStatus === "PENDING_APPROVAL") {
            setVerificationStatus("pending_approval")
          } else {
            setVerificationStatus("success")
          }
        } else {
          setVerificationStatus("error")
          setErrorMessage(response.message)
        }
      } catch {
        setVerificationStatus("error")
        setErrorMessage("Failed to verify email")
      } finally {
        setIsVerifying(false)
      }
    }

    verify()
  }, [token])

  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email")
      return
    }

    setIsResending(true)
    try {
      const response = await resendVerification(email)
      if (response.success) {
        toast.success("Verification email sent!")
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to resend verification email")
    } finally {
      setIsResending(false)
    }
  }

  if (isVerifying) {
    return <FullPageLoader message="Verifying your email..." />
  }

  // Email verified and account is ACTIVE
  if (verificationStatus === "success") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-fit rounded-full bg-primary/10 p-4">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Email Verified!</h1>
          <p className="text-sm text-muted-foreground">
            Your email has been successfully verified. You can now log in to your account.
          </p>
        </div>
        <Link href="/login">
          <Button className="w-full">Continue to Login</Button>
        </Link>
      </div>
    )
  }

  // Email verified but pending admin approval
  if (verificationStatus === "pending_approval") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-fit rounded-full bg-amber-500/10 p-4">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Email Verified!</h1>
          <p className="text-sm text-muted-foreground">
            Your email has been successfully verified. Your account is now pending approval by an administrator.
          </p>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                ✓
              </div>
              <p className="text-left">Email verification complete</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-medium text-amber-500">
                2
              </div>
              <p className="text-left">An administrator will review your registration</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                3
              </div>
              <p className="text-left">You'll receive an email when your account is approved</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          This usually takes 1-2 business days. You'll be notified by email once approved.
        </p>

        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  // Verification error
  if (verificationStatus === "error") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-fit rounded-full bg-destructive/10 p-4">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Verification Failed</h1>
          <p className="text-sm text-muted-foreground">
            {errorMessage || "This verification link is invalid or has expired."}
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Enter your email to resend verification</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleResend} disabled={isResending}>
            {isResending ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Resend Verification Email
          </Button>
        </div>
        <Link href="/login">
          <Button variant="ghost" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  // No token provided - show resend form
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Verify Your Email</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to receive a verification link
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button className="w-full" onClick={handleResend} disabled={isResending}>
          {isResending ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Send Verification Email
        </Button>
      </div>
      <Link href="/login">
        <Button variant="ghost" className="w-full">
          Back to Login
        </Button>
      </Link>
    </div>
  )
}
