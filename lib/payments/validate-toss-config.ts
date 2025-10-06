/**
 * 토스페이먼츠 환경 변수 검증 유틸리티
 */

import { paymentLogger } from "@/lib/logger"

/**
 * 토스페이먼츠 설정 검증
 */
export function validateTossConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 클라이언트 키 확인
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    errors.push('NEXT_PUBLIC_TOSS_CLIENT_KEY 환경 변수가 설정되지 않았습니다.');
  } else if (!clientKey.startsWith('test_') && !clientKey.startsWith('live_')) {
    errors.push('NEXT_PUBLIC_TOSS_CLIENT_KEY가 올바른 형식이 아닙니다. test_ 또는 live_로 시작해야 합니다.');
  }
  
  // 시크릿 키 확인
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    errors.push('TOSS_SECRET_KEY 환경 변수가 설정되지 않았습니다.');
  } else if (!secretKey.startsWith('test_') && !secretKey.startsWith('live_')) {
    errors.push('TOSS_SECRET_KEY가 올바른 형식이 아닙니다. test_ 또는 live_로 시작해야 합니다.');
  }
  
  // 키 매칭 확인 (둘 다 test_ 또는 둘 다 live_로 시작해야 함)
  if (clientKey && secretKey) {
    const isClientTest = clientKey.startsWith('test_');
    const isSecretTest = secretKey.startsWith('test_');
    
    if (isClientTest !== isSecretTest) {
      errors.push('클라이언트 키와 시크릿 키의 환경이 일치하지 않습니다. 둘 다 test_ 또는 둘 다 live_로 시작해야 합니다.');
    }
  }
  
  // APP URL 확인 (선택사항이지만 권장)
  const appUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!appUrl) {
    errors.push('NEXT_PUBLIC_BASE_URL 환경 변수가 설정되지 않았습니다. 결제 리디렉션에 문제가 발생할 수 있습니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 토스페이먼츠 키 페어 확인
 */
export function checkTossKeyPair(): { 
  isValid: boolean; 
  environment: 'test' | 'live' | 'unknown';
  message: string;
} {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const secretKey = process.env.TOSS_SECRET_KEY;
  
  if (!clientKey || !secretKey) {
    return {
      isValid: false,
      environment: 'unknown',
      message: '토스페이먼츠 API 키가 설정되지 않았습니다.'
    };
  }
  
  const isClientTest = clientKey.startsWith('test_');
  const isSecretTest = secretKey.startsWith('test_');
  
  if (isClientTest && isSecretTest) {
    return {
      isValid: true,
      environment: 'test',
      message: '테스트 환경으로 설정되었습니다.'
    };
  }
  
  if (!isClientTest && !isSecretTest) {
    return {
      isValid: true,
      environment: 'live',
      message: '운영 환경으로 설정되었습니다.'
    };
  }
  
  return {
    isValid: false,
    environment: 'unknown',
    message: '클라이언트 키와 시크릿 키의 환경이 일치하지 않습니다.'
  };
}

/**
 * 디버그 정보 출력 (개발 환경에서만)
 */
export function logTossDebugInfo(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const validation = validateTossConfig();
  const keyPair = checkTossKeyPair();
  
  paymentLogger.info('=== 토스페이먼츠 설정 검증 ===');
  paymentLogger.info('설정 유효성:', validation.isValid ? '✅ 유효' : '❌ 무효');
  paymentLogger.info('환경:', keyPair.environment);
  paymentLogger.info('메시지:', keyPair.message);
  
  if (!validation.isValid) {
    paymentLogger.info('오류 목록:');
    validation.errors.forEach(error => {
      paymentLogger.info(`  - ${error}`);
    });
  }
  
  paymentLogger.info('===============================');
}