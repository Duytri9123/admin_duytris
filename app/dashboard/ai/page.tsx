import { Metadata } from 'next'
import { AiManagement } from '@/components/ai/ai-management'

export const metadata: Metadata = { title: 'Quản lý AI' }

export default function AiPage() {
  return <AiManagement />
}
