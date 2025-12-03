import { Suspense } from "react"
import { VerifyEmailForm } from "@/components/auth/verify-email-form"
import { FullPageLoader } from "@/components/common/loading-spinner"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <VerifyEmailForm />
    </Suspense>
  )
}
