'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredPermission: string
  fallbackMessage?: string
}

export function PermissionGuard({ 
  children, 
  requiredPermission, 
  fallbackMessage = "이 페이지에 접근할 권한이 없습니다." 
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }

        // Check if user is admin
        const isAdmin = session.user.user_metadata?.user_type === 'admin'
        
        // Check if user is photographer
        const { data: photographer } = await supabase
          .from('photographers')
          .select('id')
          .eq('id', session.user.id)
          .single()

        const isPhotographer = !!photographer

        // Admin has access to everything
        if (isAdmin) {
          // Admin인데 photographers 테이블에 프로필이 없으면 기본 프로필 생성
          if (!photographer) {
            const { error: createError } = await supabase
              .from('photographers')
              .insert({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || 'Admin User',
                phone: '',
                bio: 'Iris 관리자',
                personality_type: '',
                directing_style: '',
                photography_approach: '',
                youtube_intro_url: '',
                profile_image_url: '',
              })
            
            if (createError) {
              console.error('Failed to create admin profile:', createError)
            }
          }
          setHasPermission(true)
          setLoading(false)
          return
        }

        // Check photographer permissions
        if (isPhotographer) {
          const photographerPermissions = [
            'photos', 'inquiries', 'schedule', 'my-page', 'reviews', 'personality-mapping'
          ]
          
          if (photographerPermissions.includes(requiredPermission) || requiredPermission === '') {
            setHasPermission(true)
          } else {
            setHasPermission(false)
            toast.error(fallbackMessage)
            router.back()
          }
        } else {
          setHasPermission(false)
          toast.error("로그인이 필요합니다.")
          router.push('/login')
        }
      } catch (error) {
        console.error('Permission check failed:', error)
        setHasPermission(false)
        toast.error("권한 확인 중 오류가 발생했습니다.")
        router.back()
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [requiredPermission, fallbackMessage, router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">접근 권한 없음</h2>
          <p className="text-muted-foreground">{fallbackMessage}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}