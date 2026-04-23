'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { login, logout, getUser, register } from '@/lib/auth'
import type { User, LoginCredentials, RegisterData } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Không gọi getUser khi đang ở trang login để tránh loop
    if (pathname === '/login') {
      setLoading(false)
      return
    }
    getUser().then(u => {
      setUser(u)
      setLoading(false)
    })
  }, [pathname])

  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    const loggedInUser = await login(credentials)
    setUser(loggedInUser)
    // Set auth cookies cho middleware
    document.cookie = `auth_user=1; path=/; max-age=86400; SameSite=Lax`
    if (loggedInUser.isAdmin) {
      document.cookie = `is_admin=1; path=/; max-age=86400; SameSite=Lax`
    }
    // refresh để middleware đọc cookie mới trước khi navigate
    router.refresh()
    router.push('/dashboard')
    return loggedInUser
  }, [router])

  const handleLogout = useCallback(async () => {
    await logout()
    setUser(null)
    // Xóa cả auth_user và is_admin cookies
    document.cookie = 'auth_user=; path=/; max-age=0'
    document.cookie = 'is_admin=; path=/; max-age=0'
    router.push('/login')
  }, [router])

  const handleRegister = useCallback(async (data: RegisterData) => {
    const newUser = await register(data)
    setUser(newUser)
    document.cookie = `auth_user=1; path=/; max-age=86400`
    if (newUser.isAdmin) {
      document.cookie = `is_admin=1; path=/; max-age=86400`
    }
    router.push('/dashboard')
    return newUser
  }, [router])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin ?? false,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
  }
}
