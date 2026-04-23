// lib/auth.ts
import api from './api-client'
import type { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
}

// Đăng nhập - trả về user data
export async function login(credentials: LoginCredentials): Promise<User> {
  // Bước 1: authenticate (backend trả 204)
  await api.post('/login', credentials)
  // Bước 2: lấy user data từ session vừa tạo
  const user = await getUser()
  if (!user) throw new Error('Login failed')
  return user
}

// Đăng ký
export async function register(data: RegisterData): Promise<User> {
  const { data: user } = await api.post<User>('/register', data)
  return user
}

// Đăng xuất
export async function logout(): Promise<void> {
  await api.post('/logout')
}

// Lấy thông tin user hiện tại (dùng cho server-side)
export async function getUser(): Promise<User | null> {
  try {
    const { data } = await api.get<User>('/api/user')
    return data
  } catch {
    return null
  }
}

// Quên mật khẩu
export async function forgotPassword(email: string): Promise<void> {
  await api.post('/forgot-password', { email })
}

// Reset mật khẩu
export async function resetPassword(data: {
  token: string
  email: string
  password: string
  password_confirmation: string
}): Promise<void> {
  await api.post('/reset-password', data)
}
