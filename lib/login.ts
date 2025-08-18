import { createClient } from "@/lib/supabase/client";

export async function signUpNewUser(
  email: string,
  password: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  if (error) {
    throw error;
  }
  return {data, error};
}

export async function login(
  email: string,
  password: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  return {data, error};
}

export async function loginWithUserType(
  email: string,
  password: string,
) {
  const supabase = createClient();
  
  // 로그인 시도
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (authError || !authData.user) {
    return { data: authData, error: authError, userType: null, redirectPath: null };
  }

  try {
    // 먼저 photographers 테이블에서 확인
    const { data: adminData } = await supabase
      .from('photographers')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (adminData) {
      return {
        data: authData,
        error: null,
        userType: 'admin' as const,
        role: undefined,
        redirectPath: '/admin'
      };
    }

    // role이 photographer인 경우 추가 정보 확인
    const { data: photographerData } = await supabase
      .from('photographers')
      .select('id, approval_status')
      .eq('id', authData.user.id)
      .single();

    if (photographerData) {
      // 작가 승인 상태에 따라 다른 경로로 리디렉션
      const redirectPath = photographerData.approval_status === 'approved' 
        ? '/admin' // 승인된 작가는 관리자 페이지로 (제한된 권한)
        : '/admin/my-account'; // 미승인 작가는 마이페이지로

      return {
        data: authData,
        error: null,
        userType: 'photographer' as const,
        approvalStatus: photographerData.approval_status,
        redirectPath
      };
    }

    // 둘 다 없으면 에러
    return {
      data: authData,
      error: { message: '등록되지 않은 사용자입니다.' },
      userType: null,
      redirectPath: null
    };

  } catch (error) {
    console.error('Error checking user type:', error);
    return {
      data: authData,
      error: { message: '사용자 정보 확인 중 오류가 발생했습니다.' },
      userType: null,
      redirectPath: null
    };
  }
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  return {error};
}

export async function getSession() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return {data, error};
}
