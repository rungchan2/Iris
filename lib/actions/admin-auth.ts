// Stub file for deleted admin auth functionality

export async function signupWithInviteCode(data: any) {
  return { success: false, error: 'Admin authentication system removed', message: 'Admin authentication system removed' }
}

export async function validateInviteCode(code: string) {
  return { valid: false, message: 'Admin authentication system removed' }
}

export async function createInviteCode(data: any) {
  return { success: false, error: 'Admin authentication system removed', data: null }
}

export async function getInviteCodes() {
  return { success: false, error: 'Admin authentication system removed', data: [] }
}

export async function revokeInviteCode(id: string) {
  return { success: false, error: 'Admin authentication system removed', data: null }
}