"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowLeft, CheckCircle, Key } from "lucide-react";
import { requestPasswordReset, resetPassword } from "@/lib/actions/auth";

type Step = 'request' | 'verify' | 'success';

export function ResetPasswordForm() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setStep('verify');
      } else {
        setError(result.error || '비밀번호 재설정 요청에 실패했습니다.');
      }
    } catch (error) {
      setError('알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await resetPassword(token, newPassword);
      if (result.success) {
        setStep('success');
      } else {
        setError(result.error || '비밀번호 재설정에 실패했습니다.');
      }
    } catch (error) {
      setError('알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderRequestStep = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Key className="h-5 w-5" />
          <span>비밀번호 재설정</span>
        </CardTitle>
        <CardDescription>
          가입시 사용한 이메일 주소를 입력해 주세요.
          비밀번호 재설정 링크를 보내드립니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일 주소</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                재설정 링크 보내기
              </>
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderVerifyStep = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>이메일 확인</CardTitle>
        <CardDescription>
          <strong>{email}</strong>로 재설정 링크를 보냈습니다.
          이메일을 확인하고 링크에 포함된 인증 코드를 입력해 주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">인증 코드</Label>
            <Input
              id="token"
              type="text"
              placeholder="6자리 인증 코드"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              disabled={loading}
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="새 비밀번호 (최소 6자리)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="새 비밀번호 다시 입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                비밀번호 재설정 중...
              </>
            ) : (
              '비밀번호 재설정'
            )}
          </Button>

          <div className="text-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('request')}
              disabled={loading}
            >
              다른 이메일로 재시도
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span>재설정 완료</span>
        </CardTitle>
        <CardDescription>
          비밀번호가 성공적으로 재설정되었습니다.
          새로운 비밀번호로 로그인해 주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              비밀번호가 안전하게 변경되었습니다. 새로운 비밀번호로 로그인할 수 있습니다.
            </AlertDescription>
          </Alert>

          <Button 
            className="w-full" 
            onClick={() => router.push('/login')}
          >
            로그인 페이지로 이동
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-md">
      {step === 'request' && renderRequestStep()}
      {step === 'verify' && renderVerifyStep()}
      {step === 'success' && renderSuccessStep()}
    </div>
  );
}