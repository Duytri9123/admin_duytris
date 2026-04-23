/**
 * Integration tests: Admin product CRUD operations
 * Tests create, read, update, delete product via API with MSW.
 *
 * Validates: Requirements 9.2.2, 3.2.1
 */
import { server } from './mocks/server'
import { http, HttpResponse } from 'msw'
import api from '@/lib/api-client'
import { mockProduct, mockProductsPage } from './mocks/handlers'
import type { Product, PaginatedResponse } from '@/types'

const API_BASE = 'http://localhost:8000'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Admin Product CRUD Integration', () => {
  describe('List products', () => {
    it('GET /api/admin/products returns paginated list', async () => {
      const { data } = await api.get<PaginatedResponse<Product>>('/api/admin/products')

      expect(data.data).toHaveLength(1)
      expect(data.current_page).toBe(1)
      expect(data.total).toBe(1)
    })

    it('returns product with all required fields', async () => {
      const { data } = await api.get<PaginatedResponse<Product>>('/api/admin/products')
      const product = data.data[0]

      expect(product.id).toBe(mockProduct.id)
      expect(product.name).toBe(mockProduct.name)
      expect(product.status).toBe('active')
      expect(product.variants).toHaveLength(1)
    })
  })

  describe('Create product', () => {
    it('POST /api/admin/products creates product and returns 201', async () => {
      const newProductData = {
        name: 'Giày Thể Thao',
        description: 'Giày thể thao chất lượng cao',
        status: 'active',
      }

      const { data: created, status } = await api.post<Product>(
        '/api/admin/products',
        newProductData
      )

      expect(status).toBe(201)
      expect(created.id).toBeDefined()
      expect(created.name).toBe('Giày Thể Thao')
    })

    it('requests CSRF cookie before creating product', async () => {
      let csrfRequested = false
      server.use(
        http.get(`${API_BASE}/sanctum/csrf-cookie`, () => {
          csrfRequested = true
          return new HttpResponse(null, { status: 204 })
        })
      )

      await api.post('/api/admin/products', { name: 'Test Product' })
      expect(csrfRequested).toBe(true)
    })

    it('returns 422 when required fields are missing', async () => {
      server.use(
        http.post(`${API_BASE}/api/admin/products`, () => {
          return HttpResponse.json(
            { message: 'The name field is required.', errors: { name: ['required'] } },
            { status: 422 }
          )
        })
      )

      await expect(api.post('/api/admin/products', {})).rejects.toMatchObject({
        response: { status: 422 },
      })
    })
  })

  describe('Update product', () => {
    it('PUT /api/admin/products/:id updates product', async () => {
      const updates = { name: 'Áo Thun Nam Updated', status: 'inactive' as const }

      const { data: updated } = await api.put<Product>(
        `/api/admin/products/${mockProduct.id}`,
        updates
      )

      expect(updated.id).toBe(mockProduct.id)
      expect(updated.name).toBe('Áo Thun Nam Updated')
    })

    it('requests CSRF cookie before updating product', async () => {
      let csrfRequested = false
      server.use(
        http.get(`${API_BASE}/sanctum/csrf-cookie`, () => {
          csrfRequested = true
          return new HttpResponse(null, { status: 204 })
        })
      )

      await api.put(`/api/admin/products/${mockProduct.id}`, { name: 'Updated' })
      expect(csrfRequested).toBe(true)
    })

    it('returns 404 for non-existent product', async () => {
      server.use(
        http.put(`${API_BASE}/api/admin/products/:id`, ({ params }) => {
          if (params.id === '9999') {
            return HttpResponse.json({ message: 'Not found' }, { status: 404 })
          }
          return HttpResponse.json(mockProduct)
        })
      )

      await expect(
        api.put('/api/admin/products/9999', { name: 'Test' })
      ).rejects.toMatchObject({ response: { status: 404 } })
    })
  })

  describe('Delete product', () => {
    it('DELETE /api/admin/products/:id returns 204', async () => {
      const response = await api.delete(`/api/admin/products/${mockProduct.id}`)
      expect(response.status).toBe(204)
    })

    it('requests CSRF cookie before deleting product', async () => {
      let csrfRequested = false
      server.use(
        http.get(`${API_BASE}/sanctum/csrf-cookie`, () => {
          csrfRequested = true
          return new HttpResponse(null, { status: 204 })
        })
      )

      await api.delete(`/api/admin/products/${mockProduct.id}`)
      expect(csrfRequested).toBe(true)
    })

    it('returns 404 when deleting non-existent product', async () => {
      server.use(
        http.delete(`${API_BASE}/api/admin/products/:id`, ({ params }) => {
          if (params.id === '9999') {
            return HttpResponse.json({ message: 'Not found' }, { status: 404 })
          }
          return new HttpResponse(null, { status: 204 })
        })
      )

      await expect(
        api.delete('/api/admin/products/9999')
      ).rejects.toMatchObject({ response: { status: 404 } })
    })
  })

  describe('Product status management', () => {
    it('can set product status to inactive', async () => {
      const { data: updated } = await api.put<Product>(
        `/api/admin/products/${mockProduct.id}`,
        { status: 'inactive' }
      )

      expect(updated.id).toBe(mockProduct.id)
    })

    it('can set product status to draft', async () => {
      server.use(
        http.put(`${API_BASE}/api/admin/products/:id`, async ({ request }) => {
          const body = await request.json() as Partial<Product>
          return HttpResponse.json({ ...mockProduct, ...body })
        })
      )

      const { data: updated } = await api.put<Product>(
        `/api/admin/products/${mockProduct.id}`,
        { status: 'draft' }
      )

      expect(updated.status).toBe('draft')
    })
  })
})
