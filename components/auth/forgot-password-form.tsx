"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/lib/api/auth"
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth"
import { LoadingSpinner } from "@/components/common/loading-spinner"

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      const response = await forgotPassword(data.email)
      if (response.success) {
        setIsEmailSent(true)
        toast.success("Reset email sent!")
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-fit rounded-full bg-primary/10 p-4">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            {"We've sent a password reset link to"}{" "}
            <span className="font-medium text-foreground">{getValues("email")}</span>
          </p>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full bg-transparent" onClick={() => setIsEmailSent(false)}>
            Try another email
          </Button>
          <Link href="/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="text-sm text-muted-foreground">{"Enter your email and we'll send you a reset link"}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="name@example.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Mail className="mr-2 h-4 w-4" />}
        Send reset link
      </Button>

      <Link href="/login">
        <Button variant="ghost" className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Button>
      </Link>
    </form>
  )
}