// MSW v2 handlers for Admin - Laravel backend API
import { http, HttpResponse } from 'msw'
import type { User, Product, PaginatedResponse } from '@/types'

const API_BASE = 'http://localhost:8000'

// ===== MOCK DATA =====

export const mockAdmin: User = {
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  isAdmin: true,
  email_verified_at: '2024-01-01T00:00:00.000Z',
  created_at: '2024-01-01T00:00:00.000Z',
}

export const mockProduct: Product = {
  id: 1,
  name: 'Áo Thun Nam',
  slug: 'ao-thun-nam',
  description: 'Áo thun nam chất lượng cao',
  short_description: 'Áo thun nam',
  status: 'active',
  brand: { id: 1, name: 'Nike', slug: 'nike' },
  category: { id: 1, name: 'Áo', slug: 'ao' },
  images: [{ id: 1, url: '/images/ao-thun.jpg', is_thumbnail: true }],
  thumbnail_image: { id: 1, url: '/images/ao-thun.jpg', is_thumbnail: true },
  variants: [
    {
      id: 10,
      sku: 'AT-001-M',
      selling_price: 299000,
      original_price: 399000,
      quantity: 50,
      weight: 0.3,
      dimensions: null,
      is_default: true,
      attribute_values: [],
      image_indexes: [],
    },
  ],
  avg_rating: 4.5,
  rating_count: 20,
}

export const mockProductsPage: PaginatedResponse<Product> = {
  data: [mockProduct],
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 1,
}

// ===== HANDLERS =====

export const handlers = [
  // CSRF cookie
  http.get(`${API_BASE}/sanctum/csrf-cookie`, () => {
    return new HttpResponse(null, {
      status: 204,
      headers: { 'Set-Cookie': 'XSRF-TOKEN=test-csrf-token; Path=/' },
    })
  }),

  // Auth: GET /api/user
  http.get(`${API_BASE}/api/user`, () => {
    return HttpResponse.json(mockAdmin)
  }),

  // Auth: POST /login
  http.post(`${API_BASE}/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.email === 'admin@example.com' && body.password === 'admin123') {
      return HttpResponse.json(mockAdmin)
    }
    return HttpResponse.json(
      { message: 'These credentials do not match our records.' },
      { status: 422 }
    )
  }),

  // Auth: POST /logout
  http.post(`${API_BASE}/logout`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Admin Products: GET /api/admin/products
  http.get(`${API_BASE}/api/admin/products`, () => {
    return HttpResponse.json(mockProductsPage)
  }),

  // Admin Products: POST /api/admin/products
  http.post(`${API_BASE}/api/admin/products`, async ({ request }) => {
    const body = await request.json() as Partial<Product>
    return HttpResponse.json({
      ...mockProduct,
      id: 99,
      name: body.name ?? 'New Product',
      slug: 'new-product',
    }, { status: 201 })
  }),

  // Admin Products: PUT /api/admin/products/:id
  http.put(`${API_BASE}/api/admin/products/:id`, async ({ params, request }) => {
    const body = await request.json() as Partial<Product>
    return HttpResponse.json({
      ...mockProduct,
      id: Number(params.id),
      ...body,
    })
  }),

  // Admin Products: DELETE /api/admin/products/:id
  http.delete(`${API_BASE}/api/admin/products/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
