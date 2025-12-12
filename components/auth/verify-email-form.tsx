"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { verifyEmail, resendVerification } from "@/lib/api/auth"
import { FullPageLoader, LoadingSpinner } from "@/components/common/loading-spinner"
import { toast } from "sonner"

export function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isVerifying, setIsVerifying] = useState(!!token)
  const [isVerified, setIsVerified] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    const verify = async () => {
      if (!token) return

      try {
        const response = await verifyEmail(token)
        if (response.success) {
          setIsVerified(true)
        } else {
          setIsError(true)
          setErrorMessage(response.message)
        }
      } catch {
        setIsError(true)
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

  if (isVerified) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-fit rounded-full bg-primary/10 p-4">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Email verified!</h1>
          <p className="text-sm text-muted-foreground">
            Your email has been successfully verified. You can now access all features of your account.
          </p>
        </div>
        <Link href="/dashboard">
          <Button className="w-full">Continue to dashboard</Button>
        </Link>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-fit rounded-full bg-destructive/10 p-4">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Verification failed</h1>
          <p className="text-sm text-muted-foreground">
            {errorMessage || "This verification link is invalid or has expired."}
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Enter your email to resend</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleResend} disabled={isResending}>
            {isResending ? <LoadingSpinner size="sm" className="mr-2" /> : <Mail className="mr-2 h-4 w-4" />}
            Resend verification email
          </Button>
        </div>
      </div>
    )
  }

  // No token provided - show resend form
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
        <p className="text-sm text-muted-foreground">{"Enter your email to receive a verification link"}</p>
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
          {isResending ? <LoadingSpinner size="sm" className="mr-2" /> : <Mail className="mr-2 h-4 w-4" />}
          Send verification email
        </Button>
      </div>
      <Link href="/login">
        <Button variant="ghost" className="w-full">
          Back to login
        </Button>
      </Link>
    </div>
  )
}
