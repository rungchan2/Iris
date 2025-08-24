import { redirect } from 'next/navigation'

export default function AdminLoginRedirect() {
  // Admin login is now unified in the main /login page
  redirect('/login')
}