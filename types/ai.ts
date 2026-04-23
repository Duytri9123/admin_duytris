export type AiProviderType = 'openai' | 'google' | 'anthropic' | 'ollama' | 'custom'

export interface AiProvider {
  id: number
  name: string
  provider: AiProviderType
  model: string
  base_url?: string
  is_active: boolean
  is_default: boolean
  max_tokens: number
  temperature: number
  capabilities: string[]
  system_prompt?: string
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
}

export interface AiConversation {
  id: number
  ai_provider_id: number
  title: string
  context: string
  messages: ChatMessage[]
  total_tokens: number
  updated_at: string
  provider?: { id: number; name: string; provider: string }
}

export const PROVIDER_META: Record<AiProviderType, { label: string; color: string; models: string[] }> = {
  openai: {
    label: 'OpenAI',
    color: '#10a37f',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  google: {
    label: 'Google Gemini',
    color: '#4285f4',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  },
  anthropic: {
    label: 'Anthropic Claude',
    color: '#d97706',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  },
  ollama: {
    label: 'Ollama (Local)',
    color: '#6366f1',
    models: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3'],
  },
  custom: {
    label: 'Custom API',
    color: '#64748b',
    models: [],
  },
}

export const CAPABILITIES = ['chat', 'code', 'analysis', 'image', 'search', 'translation']
