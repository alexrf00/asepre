import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { FullPageLoader } from "@/components/common/loading-spinner"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
