import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold">Authentication Error</h1>
        <p className="mb-8 text-gray-600">
          There was an error during the authentication process. Please try again.
        </p>
        <Button asChild>
          <Link href="/login">
            Back to Login
          </Link>
        </Button>
      </div>
    </div>
  )
}