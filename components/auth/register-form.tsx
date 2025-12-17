// ===== FILE: components/auth/register-form.tsx =====
// Updated register form with invite token support

"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, UserPlus, AlertCircle, Mail, Lock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/lib/store/auth-store"
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth"
import { LoadingSpinner, FullPageLoader } from "@/components/common/loading-spinner"
import { checkRegistration } from "@/lib/api/auth"

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("invite")

  // State for invite validation
  const [isCheckingInvite, setIsCheckingInvite] = useState(!!inviteToken)
  const [inviteValid, setInviteValid] = useState(false)
  const [inviteEmail, setInviteEmail] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // State for registration success
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const registerUser = useAuthStore((state) => state.register)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // Check invite token on mount
  useEffect(() => {
    const validateInvite = async () => {
      if (!inviteToken) {
        setIsCheckingInvite(false)
        return
      }

      try {
        const response = await checkRegistration(inviteToken)
        
        if (response.available && response.email) {
          setInviteValid(true)
          setInviteEmail(response.email)
          setValue("email", response.email)
        } else {
          setInviteError(response.message || "Invalid or expired invite link")
        }
      } catch {
        setInviteError("Failed to validate invite link")
      } finally {
        setIsCheckingInvite(false)
      }
    }

    validateInvite()
  }, [inviteToken, setValue])

  const onSubmit = async (data: RegisterFormData) => {
    if (!inviteToken) {
      toast.error("Invalid registration - no invite token")
      return
    }

    clearError()
    const result = await registerUser({
      userName: data.userName,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      inviteToken: inviteToken,
    })

    if (result.success) {
      setRegistrationSuccess(true)
    } else {
      toast.error(result.message || "Registration failed")
    }
  }

  // Loading state while checking invite
  if (isCheckingInvite) {
    return <FullPageLoader message="Validating your invitation..." />
  }

  // No invite token - show registration unavailable message
  if (!inviteToken) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-fit rounded-full bg-muted p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Registration Unavailable</h1>
          <p className="text-sm text-muted-foreground">
            Registration is by invitation only. Please contact your administrator to request an invitation.
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  // Invalid invite token
  if (inviteError) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-fit rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Invalid Invitation</h1>
          <p className="text-sm text-muted-foreground">{inviteError}</p>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact your administrator for a new invitation.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Registration successful - show check email message
  if (registrationSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-fit rounded-full bg-primary/10 p-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Pending Approval</h1>
          <p className="text-sm text-muted-foreground">
            Your Account Has Been Created Now Wait for Administrator Approval. <span className="font-medium">{inviteEmail}</span>.
          </p>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What's next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                1
              </div>
              <p>Wait for an administrator to approve your account</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                2
              </div>
              <p>You'll receive an email when your account is ready</p>
            </div>
          </CardContent>
        </Card>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  // Valid invite - show registration form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          You've been invited to join. Complete your registration below.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input 
              id="firstName" 
              placeholder="John" 
              autoComplete="given-name" 
              {...register("firstName")} 
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input 
              id="lastName" 
              placeholder="Doe" 
              autoComplete="family-name" 
              {...register("lastName")} 
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="userName">Username</Label>
          <Input 
            id="userName" 
            placeholder="johndoe" 
            autoComplete="username" 
            {...register("userName")} 
          />
          {errors.userName && (
            <p className="text-sm text-destructive">{errors.userName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled
            className="bg-muted"
            {...register("email")}
          />
          <p className="text-xs text-muted-foreground">
            Email is pre-filled from your invitation and cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              autoComplete="new-password"
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
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <LoadingSpinner size="sm" className="mr-2" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )}
        Create account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
