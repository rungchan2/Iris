import { createClient } from '@/lib/supabase/client'
import type { Provider } from '@supabase/supabase-js'

export interface GoogleAuthOptions {
  redirectTo?: string
  queryParams?: {
    access_type?: 'offline' | 'online'
    prompt?: 'none' | 'consent' | 'select_account'
  }
}

export async function signInWithGoogle(options?: GoogleAuthOptions) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google' as Provider,
    options: {
      redirectTo: options?.redirectTo || `${window.location.origin}/auth/callback`,
      queryParams: options?.queryParams || {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }

  return data
}

export async function signUpWithGoogle(options?: GoogleAuthOptions) {
  // Google OAuth doesn't distinguish between sign in and sign up
  // New users are automatically created on first sign in
  return signInWithGoogle(options)
}

export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export async function getCurrentUser() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  
  return user
}

export async function getSession() {
  const supabase = createClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  
  return session
}