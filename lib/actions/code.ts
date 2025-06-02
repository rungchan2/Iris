"use server"

export async function validateInvitationCode(inputCode: string): Promise<boolean> {
  const validCode = process.env.INVITATION_CODE;

  if (!validCode || validCode.trim() === '') {
    return false;
  }
  
  // 대소문자를 구분하지 않고 비교
  return inputCode.trim().toUpperCase() === validCode.trim().toUpperCase();
} 