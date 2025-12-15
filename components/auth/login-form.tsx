// ===== FILE: components/auth/login-form.tsx =====
// Updated login form with account status handling

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, LogIn, AlertCircle, Clock, Mail, Ban } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuthStore } from "@/lib/store/auth-store"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import type { AccountStatus } from "@/types"

// Helper to get status-specific message and icon
function getAccountStatusInfo(status: AccountStatus | null) {
  switch (status) {
    case "PENDING_VERIFICATION":
      return {
        icon: Mail,
        title: "Email Not Verified",
        description: "Please check your email and click the verification link before logging in.",
        variant: "default" as const,
      }
    case "PENDING_APPROVAL":
      return {
        icon: Clock,
        title: "Awaiting Approval",
        description: "Your email has been verified. Your account is pending approval by an administrator. You'll receive an email when your account is approved.",
        variant: "default" as const,
      }
    case "SUSPENDED":
      return {
        icon: Ban,
        title: "Account Suspended",
        description: "Your account has been suspended. Please contact an administrator for assistance.",
        variant: "destructive" as const,
      }
    case "DEACTIVATED":
      return {
        icon: Ban,
        title: "Account Deactivated",
        description: "Your account has been deactivated. Please contact an administrator if you believe this is an error.",
        variant: "destructive" as const,
      }
    default:
      return null
  }
}

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const loginAccountStatus = useAuthStore((state) => state.loginAccountStatus)
  const clearError = useAuthStore((state) => state.clearError)
  const clearLoginStatus = useAuthStore((state) => state.clearLoginStatus)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    clearLoginStatus()
    
    const result = await login(data)
    
    if (result.success) {
      toast.success("Welcome back!")
      router.push("/dashboard")
    } else if (result.accountNotActive) {
      // Status-specific message is shown in the alert
      // Don't show a toast for account status issues
    } else {
      toast.error(result.message || "Login failed")
    }
  }

  const statusInfo = getAccountStatusInfo(loginAccountStatus)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
      </div>

      {/* Account Status Alert */}
      {statusInfo && (
        <Alert variant={statusInfo.variant}>
          <statusInfo.icon className="h-4 w-4" />
          <AlertTitle>{statusInfo.title}</AlertTitle>
          <AlertDescription>{statusInfo.description}</AlertDescription>
        </Alert>
      )}

      {/* General Error Alert (for non-status errors) */}
      {error && !loginAccountStatus && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="name@example.com" 
            autoComplete="email" 
            {...register("email")} 
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <LogIn className="mr-2 h-4 w-4" />}
        Sign in
      </Button>

      {/* Show resend verification link if pending verification */}
      {loginAccountStatus === "PENDING_VERIFICATION" && (
        <p className="text-center text-sm text-muted-foreground">
          {"Didn't receive the email? "}
          <Link href="/verify-email" className="text-primary hover:underline">
            Resend verification
          </Link>
        </p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link href="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}