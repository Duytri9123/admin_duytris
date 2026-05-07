/**
 * Comprehensive error handling for product operations
 */

export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

export interface ApiError {
  type: ErrorType
  message: string
  statusCode?: number
  details?: Record<string, string[]>
  originalError?: unknown
}

export interface ProductValidationError {
  field: string
  message: string
}

/**
 * Parse API error response
 */
export function parseApiError(error: unknown): ApiError {
  // Network error
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      type: 'NETWORK_ERROR',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.',
      originalError: error,
    }
  }

  // Axios/fetch error response
  const axiosError = error as any
  const status = axiosError?.response?.status
  const data = axiosError?.response?.data

  if (!status) {
    return {
      type: 'UNKNOWN_ERROR',
      message: 'Đã xảy ra lỗi không xác định',
      originalError: error,
    }
  }

  const message = data?.message || data?.error || 'Đã xảy ra lỗi'

  switch (status) {
    case 400:
      return {
        type: 'VALIDATION_ERROR',
        message: message || 'Dữ liệu không hợp lệ',
        statusCode: 400,
        details: data?.errors,
        originalError: error,
      }
    case 401:
      return {
        type: 'UNAUTHORIZED',
        message: 'Bạn cần đăng nhập để thực hiện hành động này',
        statusCode: 401,
        originalError: error,
      }
    case 403:
      return {
        type: 'FORBIDDEN',
        message: 'Bạn không có quyền thực hiện hành động này',
        statusCode: 403,
        originalError: error,
      }
    case 404:
      return {
        type: 'NOT_FOUND',
        message: message || 'Không tìm thấy tài nguyên',
        statusCode: 404,
        originalError: error,
      }
    case 409:
      return {
        type: 'CONFLICT',
        message: message || 'Xung đột dữ liệu. Vui lòng thử lại.',
        statusCode: 409,
        originalError: error,
      }
    case 422:
      return {
        type: 'VALIDATION_ERROR',
        message: message || 'Dữ liệu không hợp lệ',
        statusCode: 422,
        details: data?.errors,
        originalError: error,
      }
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: 'SERVER_ERROR',
        message: 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
        statusCode: status,
        originalError: error,
      }
    default:
      return {
        type: 'UNKNOWN_ERROR',
        message: message || 'Đã xảy ra lỗi',
        statusCode: status,
        originalError: error,
      }
  }
}

/**
 * Validate product data
 */
export function validateProduct(data: any): ProductValidationError[] {
  const errors: ProductValidationError[] = []

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Tên sản phẩm là bắt buộc' })
  } else if (data.name.length < 3) {
    errors.push({ field: 'name', message: 'Tên sản phẩm phải có ít nhất 3 ký tự' })
  } else if (data.name.length > 255) {
    errors.push({ field: 'name', message: 'Tên sản phẩm không được vượt quá 255 ký tự' })
  }

  if (!data.slug?.trim()) {
    errors.push({ field: 'slug', message: 'Slug là bắt buộc' })
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push({ field: 'slug', message: 'Slug chỉ được chứa chữ cái, số và dấu gạch ngang' })
  }

  if (data.status && !['active', 'inactive', 'draft'].includes(data.status)) {
    errors.push({ field: 'status', message: 'Trạng thái không hợp lệ' })
  }

  if (data.variants && Array.isArray(data.variants)) {
    data.variants.forEach((variant: any, idx: number) => {
      if (!variant.sku?.trim()) {
        errors.push({ field: `variants.${idx}.sku`, message: 'SKU là bắt buộc' })
      }
      if (!variant.selling_price || variant.selling_price <= 0) {
        errors.push({ field: `variants.${idx}.selling_price`, message: 'Giá bán phải lớn hơn 0' })
      }
      if (variant.original_price && variant.original_price < variant.selling_price) {
        errors.push({ field: `variants.${idx}.original_price`, message: 'Giá gốc phải lớn hơn hoặc bằng giá bán' })
      }
      if (variant.quantity === undefined || variant.quantity < 0) {
        errors.push({ field: `variants.${idx}.quantity`, message: 'Số lượng không hợp lệ' })
      }
    })
  }

  return errors
}

/**
 * Check if product has critical issues
 */
export function checkProductIssues(product: any): string[] {
  const issues: string[] = []

  if (!product.variants || product.variants.length === 0) {
    issues.push('⚠️ Sản phẩm chưa có biến thể nào')
  }

  const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.quantity ?? 0), 0) ?? 0
  if (totalStock === 0) {
    issues.push('⚠️ Tồn kho bằng 0 - sản phẩm sẽ không hiển thị')
  }

  if (!product.images || product.images.length === 0) {
    issues.push('⚠️ Sản phẩm chưa có hình ảnh')
  }

  if (!product.description?.trim()) {
    issues.push('⚠️ Mô tả chi tiết trống - ảnh hưởng đến SEO')
  }

  if (!product.category_id) {
    issues.push('⚠️ Chưa chọn danh mục')
  }

  return issues
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: ApiError): string {
  if (error.details && Object.keys(error.details).length > 0) {
    const firstField = Object.keys(error.details)[0]
    const firstError = error.details[firstField]?.[0]
    return firstError || error.message
  }
  return error.message
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: ApiError): string {
  const messages: Record<ErrorType, string> = {
    VALIDATION_ERROR: 'Vui lòng kiểm tra lại dữ liệu nhập vào',
    NOT_FOUND: 'Không tìm thấy tài nguyên yêu cầu',
    CONFLICT: 'Dữ liệu bị xung đột. Vui lòng làm mới và thử lại',
    UNAUTHORIZED: 'Bạn cần đăng nhập lại',
    FORBIDDEN: 'Bạn không có quyền thực hiện hành động này',
    SERVER_ERROR: 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau',
    NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra internet',
    UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định',
  }
  return messages[error.type]
}

/**
 * Retry logic for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const apiError = parseApiError(error)

      // Don't retry on validation or auth errors
      if (['VALIDATION_ERROR', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND'].includes(apiError.type)) {
        throw error
      }

      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)))
      }
    }
  }

  throw lastError
}
