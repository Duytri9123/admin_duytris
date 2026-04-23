/**
 * Integration tests: Admin authentication flows
 * Tests admin login, logout, and admin-only access verification.
 *
 * Validates: Requirements 9.2.2, 5.2, 8.1
 */
import { server } from './mocks/server'
import { http, HttpResponse } from 'msw'
import { login, logout, getUser } from '@/lib/auth'
import { mockAdmin } from './mocks/handlers'

const API_BASE = 'http://localhost:8000'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Admin Authentication Flow Integration', () => {
  describe('Admin login', () => {
    it('returns admin user with isAdmin=true on successful login', async () => {
      const user = await login({ email: 'admin@example.com', password: 'admin123' })

      expect(user.isAdmin).toBe(true)
      expect(user.email).toBe(mockAdmin.email)
      expect(user.id).toBe(mockAdmin.id)
    })

    it('throws on invalid admin credentials', async () => {
      await expect(
        login({ email: 'admin@example.com', password: 'wrongpass' })
      ).rejects.toThrow()
    })

    it('throws on non-admin credentials', async () => {
      server.use(
        http.post(`${API_BASE}/login`, async ({ request }) => {
          const body = await request.json() as { email: string }
          // Regular user trying to access admin
          if (body.email === 'user@example.com') {
            return HttpResponse.json(
              { message: 'Access denied. Admin only.' },
              { status: 403 }
            )
          }
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 422 })
        })
      )

      await expect(
        login({ email: 'user@example.com', password: 'password123' })
      ).rejects.toThrow()
    })

    it('requests CSRF cookie before admin login', async () => {
      let csrfRequested = false
      server.use(
        http.get(`${API_BASE}/sanctum/csrf-cookie`, () => {
          csrfRequested = true
          return new HttpResponse(null, { status: 204 })
        })
      )

      await login({ email: 'admin@example.com', password: 'admin123' })
      expect(csrfRequested).toBe(true)
    })
  })

  describe('Admin logout', () => {
    it('calls POST /logout and resolves', async () => {
      let logoutCalled = false
      server.use(
        http.post(`${API_BASE}/logout`, () => {
          logoutCalled = true
          return new HttpResponse(null, { status: 204 })
        })
      )

      await logout()
      expect(logoutCalled).toBe(true)
    })
  })

  describe('Admin session verification', () => {
    it('getUser returns admin user with isAdmin=true', async () => {
      const user = await getUser()

      expect(user).not.toBeNull()
      expect(user?.isAdmin).toBe(true)
    })

    it('returns null when session expired', async () => {
      server.use(
        http.get(`${API_BASE}/api/user`, () => {
          return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
        })
      )

      const user = await getUser()
      expect(user).toBeNull()
    })

    it('non-admin user is identified correctly', async () => {
      server.use(
        http.get(`${API_BASE}/api/user`, () => {
          return HttpResponse.json({
            id: 99,
            name: 'Regular User',
            email: 'user@example.com',
            isAdmin: false,
            email_verified_at: null,
            created_at: '2024-01-01',
          })
        })
      )

      const user = await getUser()
      expect(user?.isAdmin).toBe(false)
    })
  })
})
