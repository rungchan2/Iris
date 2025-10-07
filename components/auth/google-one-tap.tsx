'use client'
import { adminLogger } from "@/lib/logger"

// TODO: Refactor OAuth flow to use server actions
// This component handles Google One Tap OAuth flow which requires direct Supabase client usage
// Consider moving auth logic to server actions in future refactor

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CredentialResponse {
  credential: string
  select_by?: string
  client_id?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (notification?: (notification: any) => void) => void
          disableAutoSelect: () => void
          renderButton: (element: HTMLElement | null, config: any) => void
        }
      }
    }
  }
}

interface GoogleOneTapProps {
  clientId: string
  autoSelect?: boolean
  cancelOnTapOutside?: boolean
  redirectTo?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

const generateNonce = async (): Promise<[string, string]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  
  return [nonce, hashedNonce]
}

export function GoogleOneTap({
  clientId,
  autoSelect = true,
  cancelOnTapOutside = true,
  redirectTo = '/',
  onSuccess,
  onError,
}: GoogleOneTapProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const initializeGoogleOneTap = () => {
    void (async () => {
      if (!window.google) {
        adminLogger.error('Google One Tap script not loaded')
        return
      }

      try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          adminLogger.error('Error getting user:', error)
        }

        if (data.user) {
          router.push(redirectTo)
          return
        }

        const [nonce, hashedNonce] = await generateNonce()

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: CredentialResponse) => {
            try {
              setIsLoading(true)

              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
                nonce,
              })

              if (error) {
                throw error
              }

              adminLogger.info('Successfully logged in with Google One Tap')
              onSuccess?.()
              router.push(redirectTo)
            } catch (error) {
              adminLogger.error('Error logging in with Google One Tap:', error)
              onError?.(error as Error)
            } finally {
              setIsLoading(false)
            }
          },
          nonce: hashedNonce,
          auto_select: autoSelect,
          cancel_on_tap_outside: cancelOnTapOutside,
          // Disable FedCM in development (localhost doesn't support it properly)
          use_fedcm_for_prompt: process.env.NODE_ENV === 'production',
          itp_support: true,
        })

        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Silently handle cases where One Tap is not displayed
            // This includes FedCM AbortError which is expected in development
          }
        })
      } catch (error) {
        adminLogger.error('Error initializing Google One Tap:', error)
        onError?.(error as Error)
      }
    })()
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={initializeGoogleOneTap}
      />
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4">
            <p>Signing in...</p>
          </div>
        </div>
      )}
    </>
  )
}