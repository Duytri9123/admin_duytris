// lib/api-client.ts
import axios, { AxiosInstance, AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Tạo axios instance với cấu hình Sanctum
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,   // Gửi cookie session
  withXSRFToken: true,     // Tự động đính kèm XSRF-TOKEN header
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Lấy CSRF cookie trước mỗi mutation (POST/PUT/DELETE)
export async function getCsrfCookie(): Promise<void> {
  await apiClient.get('/sanctum/csrf-cookie')
}

// Interceptor xử lý lỗi toàn cục
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear cookies to prevent middleware redirect loop
      if (typeof document !== 'undefined') {
        document.cookie = 'auth_user=; path=/; max-age=0; SameSite=Lax'
        document.cookie = 'is_admin=; path=/; max-age=0; SameSite=Lax'
      }

      // Chỉ redirect nếu không phải đang ở /login và không phải call /api/user
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/login' &&
        !error.config?.url?.includes('/api/user')
      ) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Helper functions cho từng loại request
export const api = {
  // GET - không cần CSRF
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }),

  // POST - cần CSRF cookie trước
  post: async <T>(url: string, data?: unknown) => {
    await getCsrfCookie()
    return apiClient.post<T>(url, data)
  },

  // PUT - cần CSRF cookie trước
  put: async <T>(url: string, data?: unknown) => {
    await getCsrfCookie()
    return apiClient.put<T>(url, data)
  },

  // DELETE - cần CSRF cookie trước
  delete: async <T>(url: string) => {
    await getCsrfCookie()
    return apiClient.delete<T>(url)
  },

  // PATCH - cần CSRF cookie trước
  patch: async <T>(url: string, data?: unknown) => {
    await getCsrfCookie()
    return apiClient.patch<T>(url, data)
  },
}

export default api

// Support Ticket Admin API functions
export const supportTicketAdminApi = {
  getTickets: async (params?: {
    category?: string
    status?: string
    priority?: string
    search?: string
    date_from?: string
    date_to?: string
    per_page?: number
    page?: number
  }) => api.get('/admin/support-tickets', params),

  getTicketDetail: async (ticketId: number) =>
    api.get(`/admin/support-tickets/${ticketId}`),

  updateTicketStatus: async (ticketId: number, status: string) =>
    api.put(`/admin/support-tickets/${ticketId}/status`, { status }),

  getStats: async () =>
    api.get('/admin/support-tickets/stats'),
}
