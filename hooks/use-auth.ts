'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { login, logout, getUser, register } from '@/lib/auth'
import type { User, LoginCredentials, RegisterData } from '@/types'

// ── Singleton: chỉ fetch user 1 lần, chia sẻ giữa tất cả component ──────────
let _user: User | null = null
let _loading = true
let _fetched = false
const _listeners = new Set<() => void>()

function notify() { _listeners.forEach(fn => fn()) }

async function fetchUserOnce() {
  if (_fetched) return
  _fetched = true
  try {
    _user = await getUser()
  } catch {
    _user = null
  } finally {
    _loading = false
    notify()
  }
}

export function useAuth() {
  const [, forceUpdate] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  // Subscribe to global state changes
  useEffect(() => {
    const update = () => forceUpdate(n => n + 1)
    _listeners.add(update)
    return () => { _listeners.delete(update) }
  }, [])

  // Fetch user only once on mount — NOT on every pathname change
  useEffect(() => {
    if (pathname === '/login') {
      _loading = false
      return
    }
    fetchUserOnce()
  }, []) // ← empty deps: chỉ chạy 1 lần khi mount

  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    const loggedInUser = await login(credentials)
    _user = loggedInUser
    _fetched = true
    _loading = false
    notify()
    document.cookie = `auth_user=1; path=/; max-age=86400; SameSite=Lax`
    if (loggedInUser.isAdmin) {
      document.cookie = `is_admin=1; path=/; max-age=86400; SameSite=Lax`
    }
    router.refresh()
    router.push('/dashboard')
    return loggedInUser
  }, [router])

  const handleLogout = useCallback(async () => {
    await logout()
    _user = null
    _fetched = false // allow re-fetch after next login
    notify()
    document.cookie = 'auth_user=; path=/; max-age=0'
    document.cookie = 'is_admin=; path=/; max-age=0'
    router.push('/login')
  }, [router])

  const handleRegister = useCallback(async (data: RegisterData) => {
    const newUser = await register(data)
    _user = newUser
    _fetched = true
    _loading = false
    notify()
    document.cookie = `auth_user=1; path=/; max-age=86400`
    if (newUser.isAdmin) {
      document.cookie = `is_admin=1; path=/; max-age=86400`
    }
    router.push('/dashboard')
    return newUser
  }, [router])

  return {
    user: _user,
    loading: _loading,
    isAuthenticated: !!_user,
    isAdmin: _user?.isAdmin ?? false,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
  }
}
