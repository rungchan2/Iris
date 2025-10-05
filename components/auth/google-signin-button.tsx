'use client'

import { useState } from 'react'
import Image from 'next/image'
import { signInWithGoogle, signUpWithGoogle } from '@/lib/auth/google'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import googleLogo from '@/public/google-logo.svg'
import { authLogger } from '@/lib/logger'

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup'
  redirectTo?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  fullWidth?: boolean
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function GoogleSignInButton({
  mode = 'signin',
  redirectTo,
  className = '',
  variant = 'outline',
  size = 'default',
  fullWidth = false,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true)
      
      const authFunction = mode === 'signup' ? signUpWithGoogle : signInWithGoogle
      
      await authFunction({
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      })

      onSuccess?.()
    } catch (error) {
      authLogger.error('Google auth error:', error)
      onError?.(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const buttonText = mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={handleGoogleAuth}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Image
          src={googleLogo}
          alt="Google"
          width={18}
          height={18}
          className="mr-2"
        />
      )}
      {buttonText}
    </Button>
  )
}