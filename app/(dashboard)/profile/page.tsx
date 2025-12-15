"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Eye, EyeOff, User, Mail, Shield, Key, Calendar, Clock, MailCheck, Send } from "lucide-react"
import { z } from "zod"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoleBadge } from "@/components/common/role-badge"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { useAuthStore } from "@/lib/store/auth-store"
import { updateUserSchema, type UpdateUserFormData } from "@/lib/validations/users"
import { getInitials, formatDateTime, formatRelativeTime } from "@/lib/utils/formatters"
import { updateUser } from "@/lib/api/users"
import { changePassword } from "@/lib/api/password"
import { resendVerification } from "@/lib/api/auth"

// Password change schema with current password
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const refreshAuth = useAuthStore((state) => state.refreshAuth)

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const profileForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      userName: user?.userName || "",
    },
  })

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const handleProfileUpdate = async (data: UpdateUserFormData) => {
    if (!user) return

    setIsUpdatingProfile(true)
    try {
      const response = await updateUser(user.id, data)
      if (response.success) {
        toast.success("Profile updated successfully")
        await refreshAuth()
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePasswordUpdate = async (data: ChangePasswordFormData) => {
    setIsUpdatingPassword(true)
    try {
      const response = await changePassword(data.currentPassword, data.newPassword)

      if (response.success) {
        toast.success("Password updated successfully")
        passwordForm.reset()
        // Reset visibility states
        setShowCurrentPassword(false)
        setShowNewPassword(false)
        setShowConfirmPassword(false)
      } else {
        toast.error(response.message || "Failed to update password")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update password"
      toast.error(message)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleResendVerification = async () => {
    if (!user?.email) return

    setIsResendingVerification(true)
    try {
      const response = await resendVerification(user.email)
      if (response.success) {
        toast.success("Verification email sent! Please check your inbox.")
      } else {
        toast.error(response.message || "Failed to send verification email")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send verification email"
      toast.error(message)
    } finally {
      setIsResendingVerification(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">
              {user.firstName} {user.lastName}
            </CardTitle>
            <CardDescription>@{user.userName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{user.email}</span>
              {user.emailVerified && <MailCheck className="h-4 w-4 text-emerald-500" />}
            </div>

            {!user.emailVerified && (
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
              >
                {isResendingVerification ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Verify Email
                  </>
                )}
              </Button>
            )}

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Roles</p>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <RoleBadge key={role} role={role} />
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined
                </p>
                <p className="font-medium">{formatDateTime(user.createdAt).split(" at")[0]}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last Login
                </p>
                <p className="font-medium">{user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Update your personal information and security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Key className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="permissions" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Permissions
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-6">
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" {...profileForm.register("firstName")} />
                      {profileForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" {...profileForm.register("lastName")} />
                      {profileForm.formState.errors.lastName && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userName">Username</Label>
                    <Input id="userName" {...profileForm.register("userName")} />
                    {profileForm.formState.errors.userName && (
                      <p className="text-sm text-destructive">{profileForm.formState.errors.userName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Contact support to change your email address</p>
                  </div>

                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile && <LoadingSpinner size="sm" className="mr-2" />}
                    Save Changes
                  </Button>
                </form>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-4 mt-6">
                <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        {...passwordForm.register("currentPassword")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        {...passwordForm.register("newPassword")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        {...passwordForm.register("confirmPassword")}
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
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={isUpdatingPassword}>
                    {isUpdatingPassword && <LoadingSpinner size="sm" className="mr-2" />}
                    Update Password
                  </Button>
                </form>
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Your Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <RoleBadge key={role} role={role} />
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Your Permissions ({user.permissions.length})</h3>
                    <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                      {user.permissions.length > 0 ? (
                        user.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Permissions are inherited from your roles.</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
