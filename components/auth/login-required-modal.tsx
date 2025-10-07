'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface LoginRequiredModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  returnUrl?: string
}

export function LoginRequiredModal({
  open,
  onOpenChange,
  title = '로그인이 필요합니다',
  description = '이 기능을 사용하려면 로그인이 필요합니다.',
  returnUrl,
}: LoginRequiredModalProps) {
  const router = useRouter()

  const handleLogin = () => {
    const loginUrl = returnUrl
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/login'
    router.push(loginUrl)
  }

  const handleSignup = () => {
    const signupUrl = returnUrl
      ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/signup'
    router.push(signupUrl)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleSignup} className="w-full sm:w-auto">
            회원가입
          </Button>
          <Button onClick={handleLogin} className="w-full sm:w-auto">
            로그인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook to easily trigger login required modal
 * Usage:
 * const { showLoginRequired, LoginRequiredDialog } = useLoginRequired()
 *
 * // In component
 * <LoginRequiredDialog />
 *
 * // When needed
 * if (!user) {
 *   showLoginRequired()
 *   return
 * }
 */
export function useLoginRequired(returnUrl?: string) {
  const [open, setOpen] = React.useState(false)

  const showLoginRequired = (options?: {
    title?: string
    description?: string
    returnUrl?: string
  }) => {
    setOpen(true)
  }

  const LoginRequiredDialog = () => (
    <LoginRequiredModal
      open={open}
      onOpenChange={setOpen}
      returnUrl={returnUrl}
    />
  )

  return {
    showLoginRequired,
    LoginRequiredDialog,
    isOpen: open,
    setOpen,
  }
}

// Import React for useState
import * as React from 'react'
