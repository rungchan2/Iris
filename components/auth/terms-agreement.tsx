'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ExternalLink } from 'lucide-react'

interface TermsAgreementProps {
  agreedToTerms: boolean
  agreedToPrivacy: boolean
  onTermsChange: (checked: boolean) => void
  onPrivacyChange: (checked: boolean) => void
  termsError?: string
  privacyError?: string
  disabled?: boolean
}

export function TermsAgreement({
  agreedToTerms,
  agreedToPrivacy,
  onTermsChange,
  onPrivacyChange,
  termsError,
  privacyError,
  disabled = false,
}: TermsAgreementProps) {
  const [allAgreed, setAllAgreed] = useState(false)

  const handleAllAgreedChange = (checked: boolean) => {
    setAllAgreed(checked)
    onTermsChange(checked)
    onPrivacyChange(checked)
  }

  const handleTermsChange = (checked: boolean) => {
    onTermsChange(checked)
    if (!checked) {
      setAllAgreed(false)
    } else if (checked && agreedToPrivacy) {
      setAllAgreed(true)
    }
  }

  const handlePrivacyChange = (checked: boolean) => {
    onPrivacyChange(checked)
    if (!checked) {
      setAllAgreed(false)
    } else if (checked && agreedToTerms) {
      setAllAgreed(true)
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="all-agree"
          checked={allAgreed}
          onCheckedChange={handleAllAgreedChange}
          disabled={disabled}
          className="mt-0.5"
        />
        <Label
          htmlFor="all-agree"
          className="text-sm font-medium leading-none cursor-pointer"
        >
          전체 동의
        </Label>
      </div>

      <div className="pl-7 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Checkbox
              id="terms-agree"
              checked={agreedToTerms}
              onCheckedChange={handleTermsChange}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label
                htmlFor="terms-agree"
                className="text-sm leading-none cursor-pointer"
              >
                [필수] 이용약관 동의
              </Label>
              {termsError && (
                <p className="text-xs text-red-500 mt-1">{termsError}</p>
              )}
            </div>
          </div>
          <Link
            href="/terms?type=terms_of_service"
            target="_blank"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 ml-2"
          >
            보기
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Checkbox
              id="privacy-agree"
              checked={agreedToPrivacy}
              onCheckedChange={handlePrivacyChange}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label
                htmlFor="privacy-agree"
                className="text-sm leading-none cursor-pointer"
              >
                [필수] 개인정보 처리방침 동의
              </Label>
              {privacyError && (
                <p className="text-xs text-red-500 mt-1">{privacyError}</p>
              )}
            </div>
          </div>
          <Link
            href="/terms?type=privacy_policy"
            target="_blank"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 ml-2"
          >
            보기
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
