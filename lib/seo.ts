/**
 * SEO utility functions for auto-generating meta tags
 */

export function generateMetaTitle(productName: string, brandName?: string, categoryName?: string): string {
  let title = productName.trim()
  if (brandName?.trim()) title += ` - ${brandName.trim()}`
  if (categoryName?.trim()) title += ` | ${categoryName.trim()}`
  return title
}

export function generateMetaDescription(description: string, maxLength = 160): string {
  const stripped = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (stripped.length <= maxLength) return stripped
  return stripped.slice(0, maxLength - 3).trimEnd() + '...'
}

export function generateKeywords(
  productName: string,
  brandName?: string,
  categoryName?: string,
  attributes?: Record<string, string>
): string[] {
  const keywords: string[] = []
  const name = productName.trim()
  if (name) keywords.push(name)
  if (brandName?.trim()) { keywords.push(brandName.trim()); keywords.push(`${name} ${brandName.trim()}`) }
  if (categoryName?.trim()) { keywords.push(categoryName.trim()); keywords.push(`${name} ${categoryName.trim()}`) }
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (value?.trim()) { keywords.push(value.trim()); keywords.push(`${name} ${key} ${value.trim()}`) }
    }
  }
  return [...new Set(keywords.filter(Boolean))]
}
